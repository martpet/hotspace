import {
  canUseServiceWorker,
  collapseLineBreaks,
  createPushSub,
  createSignal,
  debounce,
  deviceType,
  getPushSub,
  osName,
  pushSubLockSignal,
  SESSION_EXPIRED_ERR_MSG,
  syncSubscriber,
  userUsername,
} from "$main";

// =====================
// Before Lazy Load
// =====================

const rootEl = document.getElementById("chat");
const chatBox = document.getElementById("chat-box");
const chatSubEl = document.getElementById("chat-sub");
const formNewMsg = document.getElementById("chat-msg-form");
const textareaNewMsg = formNewMsg?.querySelector("textarea");

const {
  locale,
  chatId,
  chatTitle,
  msgFollowupDuration,
  canModerate,
  chatSubExpires,
} = rootEl.dataset;

applyChatBoxSize();
lazyLoadMsgs();
showIosChatSubHelp();
insertMessageDialogs();
syncSubscriber().then(syncChatSub);

const mainBox = document.getElementById("chat-main");
const chatTmpl = document.getElementById("chat-template");
const dialogEditMsg = document.getElementById("edit-chat-msg-dialog");
const dialogDelMsg = document.getElementById("clean-up-inode-msg-dialog");
const textareaEditMsg = dialogEditMsg?.querySelector("textarea");
const formEditMsg = dialogEditMsg?.querySelector("form");
const btnEditMsgSubmit = dialogEditMsg?.querySelector("button.submit");
const btnScrollToUnseen = document.getElementById("scrollto-unseen-msg-btn");
const chatBeginning = document.getElementById("chat-beginning");
const msgsLoader = document.getElementById("chat-msgs-loader");
const usersTypingEl = document.querySelector("#chat-users-typing .names");
const chatSubCheckbox = document.getElementById("chat-sub-checkbox");
const chatSubDeniedTag = document.getElementById("chat-sub-denied");
const chatSubHelp = document.getElementById("chat-sub-help");
const btnAllowChatSub = document.getElementById("chat-sub-allow");

const msgsBoxReady = Promise.withResolvers();
const typingUsers = new Map();
const listFmt = new Intl.ListFormat("en");
const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
const dateTimeFmt = new Intl.DateTimeFormat(locale, {
  dateStyle: "long",
  timeStyle: "short",
});

const chatSubProgressSignal = createSignal(false);
const networkOnlineSignal = createSignal(navigator.onLine);
const unseenChatMsgSignal = createSignal();
const userActivitySignal = createSignal(new Date());

const HIGH_FREQUENCY_EVENT_DELAY = 100;
const USER_TYPING_SEND_INTERVAL = 5000;
const GENERAL_CHAT_ERR_MSG = "The chat experienced an error";

const socketUrl = new URL(location.origin);
socketUrl.pathname = `/chat/connection/${chatId}`;
socketUrl.protocol = location.protocol === "https:" ? "wss:" : "ws:";
socketUrl.searchParams.set("title", chatTitle);
socketUrl.searchParams.set("location", location.href);

let msgsBox;
let olderMsgsCursor;
let lastSeenFeedItemId;
let socket;
let newMsgSeen;
let loadOlderMsgsLocked;
let currentUserTypingSession;
let hasCurrentNotification;
let isSubscriberOnlineDispatched;

// =====================
// After Lazy
// =====================

msgsBoxReady.promise.then(() => {
  msgsBox = document.getElementById("chat-msgs");
  ({ olderMsgsCursor, lastSeenFeedItemId } = msgsBox.dataset);
  scrollToBottom(mainBox);
  connectSocket();
  prepareFormFields();
});

// =====================
// Signal's Effects
// =====================

chatSubProgressSignal.subscribe(() => {
  renderSubscriptionUi();
});

pushSubLockSignal.subscribe(() => {
  renderSubscriptionUi();
});

unseenChatMsgSignal.subscribe(() => {
  renderUnseenMsgSigns();
});

userActivitySignal.subscribe((now, prev) => {
  if (now - prev > 500) {
    renderUnseenMsgSigns();
  }
});

networkOnlineSignal.subscribe((isOnline) => {
  showChatError(isOnline ? "" : "The network is offline");
});

// =====================
// Socket
// =====================

addEventListener("beforeunload", () => {
  socket?.close();
});

function connectSocket() {
  if (lastSeenFeedItemId) {
    socketUrl.searchParams.set("lastSeenFeedItemId", lastSeenFeedItemId);
  }
  socket = new WebSocket(socketUrl.href);

  socket.onopen = () => {
    dispatchSubscriberOnline();
  };

  socket.onclose = () => {
    isSubscriberOnlineDispatched = false;
    setTimeout(connectSocket, 1000);
  };

  socket.onmessage = (event) => {
    try {
      const chatEvent = JSON.parse(event.data);
      handleInboundChatEvent(chatEvent);
    } catch (err) {
      console.error(err);
      reloadWithAlert();
    }
  };
}

// =====================
// Chat Event Dispatcher
// =====================

function dispatchChatEvent(event, options = {}) {
  const { retry = true } = options;
  return new Promise((resolve) => {
    if (socket?.readyState === 1) {
      const payload = JSON.stringify(event);
      try {
        socket.send(payload);
        return resolve({ ok: true });
      } catch {}
    }
    if (!retry) {
      return resolve({ ok: false });
    }
    setTimeout(async () => {
      resolve(await dispatchChatEvent(event, options));
    }, 500);
  });
}

// =====================
// Outbound Event Queue
// =====================

const outboundQueue = {
  queue: [],
  processing: false,
  locked: true,
  add(...args) {
    this.queue.push(args);
    if (!this.processing && !this.locked) {
      this.process();
    }
  },
  async process() {
    if (!this.queue.length || this.locked) {
      this.processing = false;
      return;
    }
    this.processing = true;
    await dispatchChatEvent(...this.queue[0]);
    this.queue.shift();
    setTimeout(() => this.process(), 1000);
  },
  releaseLock() {
    if (this.locked) {
      this.locked = false;
      if (!this.processing) {
        this.process();
      }
    }
  },
};

// =====================
// Inbound Chat Events
// =====================

const INBOUND_EVENT_HANDLERS = {
  "chat-ready": handleChatReadyEvent,
  "new-chat-msg-resp": renderOutboundNewMsgResp,
  "edited-chat-msg-resp": renderOutboundEditedMsgResp,
  "deleted-chat-msg-resp": renderOutboundDeletedMsgResp,
  "load-older-messages-resp": handleLoadOlderMsgsResp,
  feed: handleInboundFeed,
  "user-typing": handleInboundUserTyping,
  error: handleInboundError,
};

function handleInboundChatEvent(chatEvent) {
  INBOUND_EVENT_HANDLERS[chatEvent.type](chatEvent.data);
}

/**
 * Inbound Error
 */
function handleInboundError(data) {
  const msgByName = {
    ChatDisabledError: "The chat has been disabled.",
    ChatNotFoundError: `The page has been deleted.`,
    UserNotFoundError: SESSION_EXPIRED_ERR_MSG,
  };
  reloadWithAlert(msgByName[data.name]);
}

/**
 * Inbound Chat Ready Event
 */
function handleChatReadyEvent() {
  outboundQueue.releaseLock();
}

/**
 * Inbound User Typing
 */
function handleInboundUserTyping({ username, lastUserMsgId }) {
  if (lastUserMsgId === findLastMsgByUser(username)?.id) {
    renderUsersTyping(username);
  }
}

/**
 * Inbound "Load Older Messages" Response
 */
function handleLoadOlderMsgsResp({ messages, nextCursor }) {
  olderMsgsCursor = nextCursor;
  const firstMsg = msgsBox.querySelector(".chat-msg");
  const firstMsgRectBefore = firstMsg.getBoundingClientRect();
  renderOlderMessagesLoaded(messages);
  if (!nextCursor) {
    msgsLoader.remove();
    chatBeginning.hidden = false;
  }
  const firstMsgRect = firstMsg.getBoundingClientRect();
  mainBox.scrollBy({ top: firstMsgRect.top - firstMsgRectBefore.top });
  loadOlderMsgsLocked = false;
}

/**
 * Inbound Feed
 */
const FEED_ITEM_HANDLERS = {
  "new-chat-msg": renderInboundNewMsg,
  "edited-chat-msg": renderInboundEditedMsg,
  "deleted-chat-msg": renderInboundDeletedMsg,
};

function handleInboundFeed(feedItems) {
  if (feedItems.length) {
    lastSeenFeedItemId = feedItems.at(-1).id;
    dispatchChatEvent({
      type: "last-seen-feed-item",
      data: { id: lastSeenFeedItemId },
    });
  }
  const wasScrolledToBottom = isScrolledToBottom(mainBox);
  let firstNewMsg;
  for (const item of feedItems) {
    FEED_ITEM_HANDLERS[item.type](item.data);
    const isChatMsg = item.type === "new-chat-msg";
    if (isChatMsg && item.data.username !== userUsername) {
      firstNewMsg ??= item.data;
      renderUsersTyping(item.data.username, false);
    }
  }
  if (firstNewMsg) {
    if (wasScrolledToBottom) {
      scrollToBottom(mainBox, "smooth");
    }
    if (!document.hasFocus()) {
      showChatMsgNotification(firstNewMsg);
    }
    if (!unseenChatMsgSignal.value) {
      unseenChatMsgSignal.value = document.getElementById(firstNewMsg.id);
    }
  }
}

// =====================
// DOM Listeners/Observers
// =====================

/**
 * Window Online
 */
addEventListener("online", () => (networkOnlineSignal.value = true));
addEventListener("offline", () => (networkOnlineSignal.value = false));

/**
 * Window Focus
 */
addEventListener(
  "focus",
  debouncedEvent(() => {
    userActive();
    syncSubscriber();
  })
);

/**
 * Window Scroll
 */
addEventListener(
  "scroll",
  debouncedEvent(() => {
    userActive();
  }),
  { passive: true }
);

/**
 * Window Blur
 */
addEventListener("blur", () => {
  userActive();
});

/**
 * Window Resize
 */
addEventListener("resize", () => {
  userActive();
});

/**
 * MainBox Scroll
 */
mainBox.addEventListener(
  "scroll",
  debouncedEvent(() => {
    userActive();
  }),
  { passive: true }
);

/**
 * Button "Scroll To Unseen" Click
 */
btnScrollToUnseen.addEventListener("click", () => {
  const msgEl = unseenChatMsgSignal.value;
  msgEl.scrollIntoView({ behavior: "smooth" });
});

/**
 * Checkbox "Subscribe" Change
 */
chatSubCheckbox?.addEventListener("change", async () => {
  chatSubProgressSignal.value = true;
  const subscriber = await createPushSub();
  if (subscriber) await toggleChatSub(chatSubCheckbox.checked);
  chatSubProgressSignal.value = false;
});

/**
 * Button "Allow Subscribe" Click
 */
btnAllowChatSub?.addEventListener("click", async () => {
  chatSubProgressSignal.value = true;
  await createPushSub();
  chatSubProgressSignal.value = false;
});

/**
 * MsgsBox MouseOver
 */
msgsBoxReady.promise.then(() => {
  msgsBox.addEventListener(
    "mouseover",
    debouncedEvent((event) => {
      insertMsgMenuMaybe(event.target.closest(".chat-msg"));
    })
  );
});

/**
 * MsgsBox Click
 */
msgsBoxReady.promise.then(() => {
  msgsBox.addEventListener("click", ({ target }) => {
    const isBtnShowDialog = target.classList.contains("show-msg-dialog-btn");
    if (isBtnShowDialog) showMsgDialog(target);
  });
});

/**
 * Dialog "Delete Message" Close
 */
dialogDelMsg?.addEventListener("close", () => {
  const { returnValue } = dialogDelMsg;
  if (!returnValue) return;
  const data = { id: returnValue };
  renderOutboundDeletedMsg(data);
  outboundQueue.add({ type: "deleted-chat-msg", data });
});

/**
 * Form "New Message" Submit
 */
formNewMsg?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!reportTextareaValidity(textareaNewMsg)) return;
  const text = textareaNewMsg.value;
  const data = { clientMsgId: crypto.randomUUID(), text };
  outboundQueue.add({ type: "new-chat-msg", data });
  renderOutboundNewMsg(data);
  unseenChatMsgSignal.value = null;
  currentUserTypingSession = null;
  textareaNewMsg.value = "";
});

/**
 * Form "Edit Msg" Submit
 */
formEditMsg?.addEventListener("submit", (event) => {
  if (event.submitter?.formMethod === "dialog") return;
  event.preventDefault();
  if (!reportTextareaValidity(textareaEditMsg)) return;
  dialogEditMsg.close();
  const text = textareaEditMsg.value;
  if (text === textareaEditMsg.dataset.initialText) return;
  const data = { id: btnEditMsgSubmit.value, text };
  outboundQueue.add({ type: "edited-chat-msg", data });
  renderOutboundEditedMsg(data);
});

/**
 * TextAreas Keydown
 */
textareaNewMsg?.addEventListener("keydown", onTextareaKeydown);
textareaEditMsg?.addEventListener("keydown", onTextareaKeydown);

function onTextareaKeydown(event) {
  if (event.key === "Enter" && deviceType !== "mobile" && !event.shiftKey) {
    event.preventDefault();
    if (event.repeat) return;
    const form = event.target.closest("form");
    if (!form.reportValidity()) return;
    form.dispatchEvent(new Event("submit", { cancelable: true }));
  }
}

/**
 * TextArea "New Message" Input
 */
textareaNewMsg?.addEventListener("input", async () => {
  const { prevText = "", lastSent = 0 } = (currentUserTypingSession ??= {});
  const text = textareaNewMsg.value;
  const isDeleting = text.length < prevText.length;
  const now = Date.now();
  const throttled = USER_TYPING_SEND_INTERVAL + lastSent > now;
  currentUserTypingSession.prevText = text;
  if (isDeleting || throttled) return;
  const data = {
    username: userUsername,
    lastUserMsgId: findLastMsgByUser(userUsername)?.id,
  };
  const outboundEvent = { type: "user-typing", data };
  const { ok } = await dispatchChatEvent(outboundEvent, { retry: false });
  if (ok) currentUserTypingSession.lastSent = now;
});

/**
 * Service Worker Message
 */
navigator.serviceWorker.addEventListener("message", async ({ data }) => {
  if (data.type === "chat-msg-notification-click") {
    await msgsBoxReady.promise;
    const msgEl = document.getElementById(data.chatMsgId);
    hasCurrentNotification = false;
    unseenChatMsgSignal.value = null;
    msgEl.scrollIntoView();
    setTimeout(() => {
      unseenChatMsgSignal.value = msgEl;
    }, 200);
  }
});

/**
 * Resize Observer
 */
const resizeObserver = new ResizeObserver(resizeObserved);
resizeObserver.observe(chatBox);

function resizeObserved(entries) {
  for (const entry of entries) {
    if (entry.target === chatBox) {
      storeChatBoxSize();
    }
  }
}

/**
 * MainBox Intersection Observer
 */
const mainBoxIntersectionObserver = new IntersectionObserver(
  mainBoxIntersectionObserved,
  { root: mainBox }
);

if (msgsLoader) {
  mainBoxIntersectionObserver.observe(msgsLoader);
}

function mainBoxIntersectionObserved(entries) {
  for (const entry of entries) {
    if (
      !loadOlderMsgsLocked &&
      entry.target === msgsLoader &&
      entry.isIntersecting
    ) {
      loadOlderMsgsLocked = true;
      entry.target.classList.add("visible");
      dispatchChatEvent({
        type: "load-older-messages",
        data: { olderMsgsCursor },
      });
    }
  }
}

// =====================
// Utils
// =====================

function userActive() {
  userActivitySignal.value = Date.now();
}

function reloadWithAlert(msg) {
  msg ??= "Oops, the chat experienced an error!";
  alert(msg);
  location.reload();
}

function sanitizeChatMsgText(text) {
  return collapseLineBreaks(text, 2);
}

function debouncedEvent(fn) {
  return debounce(fn, HIGH_FREQUENCY_EVENT_DELAY);
}

function reportTextareaValidity(el) {
  const regex = new RegExp(el.getAttribute("pattern"));
  el.setCustomValidity(regex.test(el.value) ? "" : el.title);
  return el.reportValidity();
}

function storeChatBoxSize() {
  const { width, height } = chatBox.style;
  if (width || height) {
    localStorage.setItem("chatbox-size", JSON.stringify({ width, height }));
  }
}

function scrollToBottom(el, behavior) {
  el.scrollTo({ top: el.scrollHeight, behavior, left: 0 });
}

function isScrolledToBottom(el) {
  const tolerance = 2;
  return el && el.scrollTop + el.clientHeight >= el.scrollHeight - tolerance;
}

function isInViewport(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  return rect.bottom >= 0 && rect.top <= window.innerHeight;
}

function msgIsScrolledOverTop(el) {
  return el && el.offsetTop < mainBox.scrollTop;
}

function msgIsScrolledBellowBottom(el) {
  return el && el.offsetTop > mainBox.scrollTop + mainBox.clientHeight;
}

function msgIsInView(el) {
  return (
    isInViewport(el) &&
    !msgIsScrolledOverTop(el) &&
    !msgIsScrolledBellowBottom(el)
  );
}

function isFollowUpMsg({ username, createdAt, container = msgsBox }) {
  const lastEl = container.lastChild;
  if (!lastEl?.classList.contains("chat-msg")) return false;
  if (lastEl.dataset.username !== username) return false;
  const prevDateIso = lastEl.querySelector("time").dateTime;
  const diff = Math.abs(createdAt.getTime() - new Date(prevDateIso).getTime());
  return diff < Number(msgFollowupDuration);
}

function findLastMsgByUser(username) {
  return msgsBox.querySelector(
    `.chat-msg:nth-last-child(1 of [data-username="${username}"])`
  );
}

async function showChatMsgNotification(msg) {
  if (!canUseServiceWorker || hasCurrentNotification) return;
  const [db, reg] = await Promise.all([
    import("$db"),
    navigator.serviceWorker.getRegistration(),
  ]);
  if (!(await db.getChatSub(chatId))) return;
  hasCurrentNotification = true;
  reg.active.postMessage({
    type: "new-chat-msg",
    chatMsgId: msg.id,
    chatTitle,
  });
}

async function toggleChatSub(isSubscribe) {
  const db = await import("$db");
  const subscriber = await db.getSubscriber();
  try {
    const resp = await fetch("/chat/subs", {
      method: isSubscribe ? "post" : "delete",
      body: JSON.stringify({
        chatId,
        subscriberId: subscriber.id,
        isSubscriberInChat: true,
      }),
    });
    const isCreated = resp.status === 201;
    const isDeleted = resp.status === 204;
    const isUnprocessable = resp.status === 422;
    if (isCreated) {
      await db.setChatSub({ ...(await resp.json()) });
      dispatchSubscriberOnline({ skipChatSubUpdate: true });
    } else if (isDeleted || isUnprocessable) {
      await db.deleteChatSub(chatId);
    }
  } catch (err) {
    console.error(err);
  }
}

async function syncChatSub() {
  if (!canUseServiceWorker) return;
  pushSubLockSignal.value = true;
  const db = await import("$db");
  const [subscriber, chatSub] = await Promise.all([
    db.getSubscriber(),
    db.getChatSub(chatId),
  ]);
  if (subscriber) {
    const expiredWithoutPushSub =
      Date.now() - new Date(subscriber.pushSubUpdatedAt).getTime() >
      Number(chatSubExpires);
    if (!subscriber.pushSub && expiredWithoutPushSub) {
      await toggleChatSub(false);
    }
  } else if (chatSub) {
    await createPushSub();
    await toggleChatSub(true);
  }
  pushSubLockSignal.value = false;
}

async function dispatchSubscriberOnline({ skipChatSubUpdate } = {}) {
  if (isSubscriberOnlineDispatched) return;
  const db = await import("$db");
  const subscriber = await db.getSubscriber();
  const chatSub = await db.getChatSub(chatId);
  if (chatSub) {
    isSubscriberOnlineDispatched = true;
    dispatchChatEvent({
      type: "subscriber-online",
      data: {
        subscriberId: subscriber.id,
        skipChatSubUpdate,
      },
    });
  }
}

async function lazyLoadMsgs() {
  const lazyRootEl = document.getElementById("chat-lazy-root");
  if (!lazyRootEl) {
    msgsBoxReady.resolve();
  } else {
    const url = new URL(`/chat/lazy-load/${chatId}`, location.origin);
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    url.searchParams.set("tz", timeZone);
    const resp = await fetch(url.href);
    if (!resp.ok) {
      showChatError(GENERAL_CHAT_ERR_MSG);
    } else {
      lazyRootEl.outerHTML = await resp.text();
      msgsBoxReady.resolve();
    }
  }
}

// =====================
// Chat Events Rendering
// =====================

function renderOutboundNewMsg({ clientMsgId, text }) {
  const createdAt = new Date();
  const msgEl = buildMsgEl({
    id: clientMsgId,
    username: userUsername,
    text,
    createdAt,
  });
  msgEl.classList.add("pending");
  appendDayElMaybe({ createdAt });
  msgsBox.append(msgEl);
  msgEl.scrollIntoView();
}

function renderOutboundNewMsgResp({ id, clientMsgId }) {
  const el = document.getElementById(clientMsgId);
  if (!el) return;
  el.classList.remove("pending");
  el.id = id;
}

function renderInboundNewMsg({ id, clientMsgId, username, text, createdAt }) {
  if (document.getElementById(id)) return;
  const el = document.getElementById(clientMsgId);
  if (el) {
    el.classList.remove("pending");
  } else {
    createdAt = new Date(createdAt);
    const newEl = buildMsgEl({ el, id, username, text, createdAt });
    appendDayElMaybe({ createdAt });
    msgsBox.append(newEl);
  }
}

function renderOutboundEditedMsg({ id, text }) {
  const editedAt = new Date();
  const el = document.getElementById(id);
  if (!el) return;
  buildMsgEl({ el, text, editedAt });
  el.classList.add("pending");
  if (msgIsScrolledOverTop(el)) {
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function renderOutboundEditedMsgResp({ id }) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("pending");
}

function renderInboundEditedMsg({ id, text, editedAt }) {
  editedAt = new Date(editedAt);
  const el = document.getElementById(id);
  if (!el || el.classList.contains("deleted")) return;
  buildMsgEl({ el, text, editedAt });
}

function renderOutboundDeletedMsg({ id }) {
  const el = document.getElementById(id);
  if (!el) return;
  const mainEl = el.querySelector(".main");
  mainEl.insertAdjacentHTML(
    "afterbegin",
    "<span class='spinner-xs' role='progressbar'></span>"
  );
  el.classList.add("deleted", "pending");
}

function renderOutboundDeletedMsgResp({ id }) {
  const el = document.getElementById(id);
  if (el) removeMsgEl(el);
}

function renderInboundDeletedMsg({ id }) {
  const el = document.getElementById(id);
  if (el) removeMsgEl(el);
}

function renderOlderMessagesLoaded(messages) {
  const container = new DocumentFragment();
  for (const msg of messages) {
    const { id, username, text } = msg;
    const createdAt = new Date(msg.createdAt);
    const editedAt = msg.editedAt ? new Date(msg.editedAt) : null;
    const el = buildMsgEl({
      id,
      username,
      text,
      createdAt,
      editedAt,
      container,
    });
    appendDayElMaybe({ createdAt, container });
    container.append(el);
  }
  const msgsBoxFirstHeading = msgsBox.querySelector(".day");
  const containerLastHeading = container.querySelector(".day:last-of-type");
  if (msgsBoxFirstHeading.textContent === containerLastHeading.textContent) {
    msgsBoxFirstHeading.remove();
  }
  msgsBox.prepend(container);
}

function renderUsersTyping(username, isTyping = true) {
  clearTimeout(typingUsers.get(username));
  const wasAlreadyTyping = typingUsers.has(username);
  if (isTyping) {
    typingUsers.set(
      username,
      setTimeout(() => renderUsersTyping(username, false), 10000)
    );
  } else {
    typingUsers.delete(username);
  }
  if (isTyping === wasAlreadyTyping) return;
  let str = "";
  if (typingUsers.size) {
    const limit = 3,
      diff = typingUsers.size - limit;
    const names = [...typingUsers.keys()]
      .slice(0, limit)
      .map((username) => `<b>${username}</b>`);
    if (diff > 0) names[limit] = `${diff} ${diff === 1 ? "other" : "others"}`;
    str = `${listFmt.format(names)} ${
      typingUsers.size === 1 ? "is" : "are"
    } typing…`;
  }
  usersTypingEl.innerHTML = str;
}

function buildMsgEl(data) {
  const { id, username, text, createdAt, editedAt, container } = data;
  let el = data.el;
  el ??= chatTmpl.content.querySelector(".chat-msg").cloneNode(true);
  const mainEl = el.querySelector(".main");
  const canEdit = username === userUsername;
  const canDelete = canEdit || canModerate;
  const textEl = mainEl.querySelector(".text");
  textEl.textContent = sanitizeChatMsgText(text);
  if (id) el.id = id;
  if (canEdit) el.classList.add("edit");
  if (canDelete) el.classList.add("del");
  if (username) {
    el.querySelector(".username").textContent = username;
    el.dataset.username = username;
  }
  if (createdAt) {
    const timeEl = el.querySelector("time");
    timeEl.textContent = timeFmt.format(createdAt);
    timeEl.dateTime = createdAt.toISOString();
    const isFollowUp = isFollowUpMsg({ createdAt, username, container });
    if (isFollowUp) el.classList.add("follow-up");
  }
  if (editedAt) {
    let tagEdited = mainEl.querySelector(".tag-edited");
    if (!tagEdited) {
      tagEdited = chatTmpl.content.querySelector(".tag-edited").cloneNode(true);
      textEl.after(tagEdited);
    }
    tagEdited.title = dateTimeFmt.format(editedAt);
  }
  return el;
}

function removeMsgEl(el) {
  const onlyInDay = el.matches(".day + :has(+ .day), .day + :last-child");
  const beforeFirstFollowUp = el.matches(":not(.follow-up):has(+ .follow-up)");
  if (onlyInDay) el.previousSibling.remove();
  if (beforeFirstFollowUp) el.nextSibling.classList.remove("follow-up");
  el.remove();
}

function appendDayElMaybe({ createdAt, container = msgsBox }) {
  const prevDayHeading = container.querySelector(".day:last-of-type");
  const dateStr = dateFmt.format(createdAt);
  if (!prevDayHeading || prevDayHeading.textContent !== dateStr) {
    const dayEl = chatTmpl.content.querySelector(".day").cloneNode(true);
    dayEl.textContent = dateStr;
    container.append(dayEl);
  }
}

// =====================
// General Rendering
// =====================

function prepareFormFields() {
  if (!userUsername) return;
  formNewMsg.querySelector("fieldset").disabled = false;
  formNewMsg.querySelector("fieldset button").hidden = deviceType !== "mobile";
}

function applyChatBoxSize() {
  const size = JSON.parse(localStorage.getItem("chatbox-size"));
  if (size?.width) chatBox.style.width = size.width;
  if (size?.height) chatBox.style.height = size.height;
}

function renderUnseenMsgSigns() {
  const msgEl = unseenChatMsgSignal.value;
  if (!msgEl) {
    btnScrollToUnseen.hidden = true;
    const prevMsgEl = msgsBox.querySelector(".first-new-msg");
    prevMsgEl?.classList.remove("first-new-msg");
    newMsgSeen = false;
  } else if (newMsgSeen) {
    unseenChatMsgSignal.value = null;
  } else {
    msgEl.classList.add("first-new-msg");
    const inView = msgIsInView(msgEl);
    newMsgSeen = inView && document.hasFocus();
    btnScrollToUnseen.hidden = inView;
  }
}

function showChatError(msg) {
  const el = document.getElementById("chat-error");
  if (msg) {
    const html = `<p id="chat-error" class="alert error">${msg}</p>`;
    el ? (el.innerHTML = html) : chatBox.insertAdjacentHTML("afterbegin", html);
  } else {
    el?.remove();
  }
}

function showMsgDialog(dialogOpenBtn) {
  const isEditDialog = dialogOpenBtn.classList.contains("edit-btn");
  const dialog = isEditDialog ? dialogEditMsg : dialogDelMsg;
  const msgEl = dialogOpenBtn.closest(".chat-msg");
  const msgPreviewEl = dialog.querySelector(".preview .chat-msg");
  const submitBtn = dialog.querySelector(".submit");
  submitBtn.value = msgEl.id;
  msgPreviewEl.innerHTML = msgEl.innerHTML;
  msgPreviewEl.querySelector(".chat-msg-menu")?.remove();
  if (isEditDialog) {
    const text = msgEl.querySelector(".text").textContent;
    textareaEditMsg.value = text;
    textareaEditMsg.dataset.initialText = text;
    msgPreviewEl.querySelector(".main").remove();
  }
  dialog.showModal();
}

async function renderSubscriptionUi() {
  if (!chatSubCheckbox || chatSubEl.hidden) {
    return;
  }
  const [chatSub, pushSub] = await Promise.all([
    import("$db").then((db) => db.getChatSub(chatId)),
    getPushSub(),
  ]);
  const { permission } = Notification;
  const needPushSub = chatSub && !pushSub && permission !== "denied";
  const permissionUnset = chatSub && permission === "default";
  const notAllowed = permission === "denied" || permissionUnset || needPushSub;
  const isLocked = chatSubProgressSignal.value || pushSubLockSignal.value;
  const isBtnAllowHidden = !permissionUnset && !needPushSub;
  const isDeniedTagHidden = permission !== "denied";
  if (!isLocked) chatSubCheckbox.checked = chatSub;
  chatSubCheckbox.classList.toggle("not-allowed", !!notAllowed);
  chatSubEl.classList.toggle("spinner-xs", chatSubProgressSignal.value);
  chatSubCheckbox.disabled = isLocked || notAllowed;
  btnAllowChatSub.disabled = isLocked;
  chatSubDeniedTag.hidden = isDeniedTagHidden;
  btnAllowChatSub.hidden = isBtnAllowHidden;
  chatSubHelp.hidden = !isDeniedTagHidden || !isBtnAllowHidden;
}

function showIosChatSubHelp() {
  if (osName === "iOS" && !navigator.standalone) {
    document.getElementById("ios-chat-sub-help").hidden = false;
    chatSubEl.hidden = true;
    return true;
  }
}

function insertMsgMenuMaybe(msgEl) {
  if (!msgEl?.classList.contains("edit") && !msgEl?.classList.contains("del")) {
    return;
  }
  msgEl.querySelector(".main:not(:has(.chat-msg-menu))")?.insertAdjacentHTML(
    "beforeend",
    `
      <span class="chat-msg-menu">
        <button class="show-msg-dialog-btn edit-btn">Edit</button>
        <button class="show-msg-dialog-btn del-btn">
          Delete
        </button>
      </span>
    `
  );
}

function insertMessageDialogs() {
  if (!userUsername) return;
  function msgPreview({ editMode } = {}) {
    return `
      <blockquote class="preview">
        <p class="chat-msg"></p>
        ${editMode ? textareaNewMsg.outerHTML : ""}
      </blockquote>
    `;
  }
  rootEl.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="edit-chat-msg-dialog" class="chat-msg-dialog">
        <h1>Edit message</h1>
        <form class="basic">
          ${msgPreview({ editMode: true })}
          <footer>
            <button formmethod="dialog" formnovalidate>Cancel</button>
            <button class="submit">Submit</button>
          </footer>
        </form>
      </dialog>
      
      <dialog id="clean-up-inode-msg-dialog" class="chat-msg-dialog">
        <h1>Delete message</h1>
        <p class="alert warning">Are you sure you want to delete this message?</p>
        ${msgPreview()}
        <form method="dialog" class="basic">
          <footer>
            <button>Cancel</button>
            <button autofocus class="submit">Yes, Delete</button>
          </footer>
        </form>
      </dialog>
  `
  );
}
