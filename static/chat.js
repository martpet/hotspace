const chatBox = document.getElementById("chat-box");
const {
  locale,
  spaceId,
  spaceName,
  spaceItemId,
  spaceItemName,
  msgFollowupDuration,
  userDisplayName,
} = chatBox.dataset;
const msgsBox = document.getElementById("chat-messages");
const msgForm = document.getElementById("chat-msg-form");
const msgTemplate = document.getElementById("msg-template");
const dayHeadingTemplate = document.getElementById("day-heading-template");
const msgFieldset = msgForm?.querySelector("fieldset");
const msgTextarea = msgForm?.querySelector("textarea");
const msgFormButton = msgForm?.querySelector("button");
const resizeObserver = new ResizeObserver(handleResizeObserver);
const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
const SOCKET_SCHEME = location.protocol === "https:" ? "wss" : "ws";
const SOCKET_PATH = `chat/${spaceId}${spaceItemId ? `/${spaceItemId}` : ""}`;
const SOCKET_URL = `${SOCKET_SCHEME}://${location.host}/${SOCKET_PATH}`;

let socket;
let lastSeenFeedItemId = chatBox.dataset.lastSeenFeedItemId;

// =====================
// On Document Parsed
// =====================

applyChatboxSize();
scrollToBottom(msgsBox);
connectSocket();
setInputElementsVisibility();
resizeObserver.observe(chatBox);

// =====================
// Socket
// =====================

window.addEventListener("beforeunload", () => {
  socket?.close();
});

function connectSocket() {
  const url = new URL(SOCKET_URL);
  if (lastSeenFeedItemId) {
    url.searchParams.set("lastSeenFeedItemId", lastSeenFeedItemId);
  }
  socket = new WebSocket(url.href);

  socket.addEventListener("close", () => {
    setTimeout(connectSocket, 1000);
  });

  socket.addEventListener("message", (event) => {
    try {
      handleInboundData(JSON.parse(event.data));
    } catch (err) {
      console.error(err);
      reloadWithError();
    }
  });
}

// =====================
// Outbound Data Queue
// =====================

const QUEUE = [];
let queueProcessing = false;

function dispatch(data) {
  QUEUE.push(data);
  if (!queueProcessing) processQueue();
}

function processQueue() {
  if (!QUEUE.length) {
    queueProcessing = false;
    return;
  }
  queueProcessing = true;
  if (socket?.readyState === 1) {
    try {
      socket.send(JSON.stringify(QUEUE[0]));
      QUEUE.shift();
    } catch {
    }
  }
  setTimeout(processQueue, 1000);
}

// =====================
// Inbound Data Handler
// =====================

const HANDLERS = {
  "error": handleInboundError,
  "new-chat-msg-resp": handleNewChatMsgEventResp,
  "feed-items": handleFeedItems,
};

function handleInboundData(data) {
  const handler = HANDLERS[data.type];
  if (handler) {
    handler(data);
  } else {
    throw new Error(`Missing handler for data type: "${data.type}"`);
  }
}

// =====================
// New Chat Msg Resp Handler
// =====================

function handleNewChatMsgEventResp(data) {
  renderOutboundMsgResp(data);
}

// =====================
// Feed Items Handler
// =====================

function handleFeedItems(data) {
  lastSeenFeedItemId = data.items.at(-1).msg.feedItemId;
  dispatch({
    type: "last-seen-feed-item-id",
    feedItemId: lastSeenFeedItemId,
  });
  const wasScrolledToBottom = isScrolledToBottom(msgsBox);
  for (const item of data.items) {
    if (item.type === "new-chat-msg") {
      renderInboundChatMessage(item.msg);
    }
  }
  if (wasScrolledToBottom) {
    scrollToBottom(msgsBox, "smooth");
  }
}

// =====================
// Inbound Error Handler
// =====================

const ERRORS = {
  UserNotFoundError: APP.SESSION_EXPIRED_ERROR_MSG,
  SpaceNotFoundError: `Space "${spaceName}" has been deleted!`,
  SpaceItemNotFoundError: `"${spaceItemName}" has been deleted!`,
  ChatDisabledError: "The chat has been disabled!",
};

function handleInboundError({ errorName }) {
  reloadWithError(ERRORS[errorName]);
}

// =====================
// User Event Listeners
// =====================

msgForm?.addEventListener("submit", (event) => {
  handleMsgFormSubmit(event);
});

msgTextarea?.addEventListener("keydown", (event) => {
  handleTextareaKeyDown(event);
});

// =====================
// User Event Handlers
// =====================

function handleMsgFormSubmit(event) {
  event.preventDefault();
  if (!reportTextareaValidity(msgTextarea)) return;
  const data = {
    type: "new-chat-msg",
    clientMsgId: crypto.randomUUID(),
    text: msgTextarea.value,
  };
  dispatch(data);
  renderOutboundMsg(data);
}

function handleTextareaKeyDown(event) {
  if (!APP.ismobile && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (event.repeat) return;
    const submit = new Event("submit", { cancelable: true });
    msgForm.dispatchEvent(submit);
  }
}

function handleResizeObserver(entries) {
  for ({ target } of entries) {
    if (target === chatBox) storeChatBoxSize();
  }
}

// =====================
// Utils
// =====================

function reloadWithError(msg) {
  msg ??= "Oops, the chat experienced an error!";
  alert(msg);
  location.reload();
}

function sanitizeChatMsgText(text) {
  return APP.collapseLineBreaks(text, 2);
}

function reportTextareaValidity(el) {
  const pattern = el.getAttribute("pattern");
  const regex = new RegExp(pattern);
  el.setCustomValidity(regex.test(el.value) ? "" : el.title);
  return el.reportValidity();
}

function storeChatBoxSize() {
  const { width, height } = chatBox.style;
  if (width || height) {
    localStorage.setItem("chatbox-size", JSON.stringify({ width, height }));
  }
}

function isScrolledToBottom(el) {
  const tolerance = 2;
  return el.scrollTop + el.clientHeight >= el.scrollHeight - tolerance;
}

function isFollowUpMsg({ createdAt, displayName }) {
  const lastEl = msgsBox.lastChild;
  if (!lastEl?.classList.contains("msg")) return false;
  const prevDisplayName = lastEl.querySelector(".name").textContent;
  if (prevDisplayName !== displayName) return false;
  const prevDateIso = lastEl.querySelector("time").dateTime;
  const diff = Math.abs(createdAt.getTime() - new Date(prevDateIso).getTime());
  return diff < Number(msgFollowupDuration);
}

// =====================
// DOM Manipulation
// =====================

function applyChatboxSize() {
  const size = JSON.parse(localStorage.getItem("chatbox-size"));
  if (size?.width) chatBox.style.width = size.width;
  if (size?.height) chatBox.style.height = size.height;
}

function renderOutboundMsg(data) {
  const { clientMsgId: id, text } = data;
  const createdAt = new Date();
  const msgEl = buildMsgElement({
    id,
    text,
    createdAt,
    displayName: userDisplayName,
  });
  msgEl.classList.add("pending");
  appendDayHeadingMaybe(createdAt);
  msgsBox.append(msgEl);
  msgTextarea.value = "";
  msgEl.scrollIntoView();
}

function renderOutboundMsgResp(data) {
  const { msgId, clientMsgId } = data;
  const msgEl = document.getElementById(clientMsgId);
  if (!msgEl) return;
  msgEl.classList.remove("pending");
  msgEl.id = msgId;
}

function renderInboundChatMessage(msg) {
  const createdAt = new Date(msg.createdAt);
  let currEl = document.getElementById(msg.id);
  if (!currEl) {
    currEl = document.getElementById(msg.clientMsgId);
    if (currEl && currEl.querySelector(".name") !== msg.displayName) return;
  }
  const newElMaybe = buildMsgElement({ currEl, ...msg, createdAt });
  if (currEl) {
    currEl.classList.remove("pending");
  } else {
    appendDayHeadingMaybe(createdAt);
    msgsBox.append(newElMaybe);
  }
}

function buildMsgElement(data) {
  const { currEl, id, displayName, text, createdAt } = data;
  const el = currEl || msgTemplate.content.cloneNode(true).firstChild;
  const nameEl = el.querySelector(".name");
  const textEl = el.querySelector(".text");
  const timeEl = el.querySelector("time");
  timeEl.dateTime = createdAt.toISOString();
  timeEl.textContent = timeFmt.format(createdAt);
  nameEl.textContent = displayName;
  textEl.textContent = sanitizeChatMsgText(text);
  if (isFollowUpMsg(data)) el.classList.add("follow-up");
  el.id = id;
  return el;
}

function appendDayHeadingMaybe(date) {
  const prevDayHeading = msgsBox.querySelector(".day:last-of-type");
  const dateStr = dateFmt.format(date);
  if (!prevDayHeading || prevDayHeading.textContent !== dateStr) {
    const headingEl = dayHeadingTemplate.content.cloneNode(true).firstChild;
    headingEl.textContent = dateStr;
    msgsBox.append(headingEl);
  }
}

function scrollToBottom(el, behavior) {
  el.scrollTo({ left: 0, top: el.scrollHeight, behavior });
}

function setInputElementsVisibility() {
  if (!msgForm) return;
  if (APP.ismobile) msgFormButton.hidden = false;
  msgFieldset.disabled = false;
}
