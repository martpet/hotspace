import * as db from "./db.js";
import { createPushSub, syncPushSub } from "./main.js";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  if (self.registration.pushManager) {
    if (event.newSubscription) {
      event.waitUntil(syncPushSub({ db }));
    } else {
      event.waitUntil(createPushSub({ db, forceNew: true }));
    }
  }
});

// https://issues.chromium.org/issues/378103918
self.addEventListener("push", (event) => {
  const data = event.data.json();
  if (data.type === "test-notification") {
    event.waitUntil(showNotification({
      title: "Test Notification",
      body: "Please, ignore.",
    }));
  } else if (data.type === "new-chat-msg") {
    event.waitUntil(showNewChatMsgNotification({
      pageTitle: data.pageTitle,
      chatMsgId: data.chatMsgId,
      chatUrl: data.chatUrl,
    }));
  }
});

self.addEventListener("message", (event) => {
  const { data } = event;
  if (data.type === "new-chat-msg") {
    event.waitUntil(showNewChatMsgNotification({
      pageTitle: data.pageTitle,
      chatMsgId: data.chatMsgId,
      clientId: event.source.id,
    }));
  }
});

self.addEventListener("notificationclick", (event) => {
  const { notification } = event;
  const data = notification.data || {};
  if (data.type === "chat-msg-notification") {
    event.waitUntil(handleChatMsgNotificationClick(notification));
  }
});

function showNewChatMsgNotification(
  { pageTitle, chatMsgId, chatUrl, clientId },
) {
  return showNotification({
    title: `New message in '${pageTitle}'`,
    data: {
      type: "chat-msg-notification",
      chatMsgId,
      chatUrl,
      clientId,
    },
  });
}

async function showNotification({ title, body, data }) {
  return self.registration.showNotification(title, {
    body,
    data,
    icon: "/static/img/logo.png",
  });
}

async function handleChatMsgNotificationClick(notification) {
  const { chatMsgId, clientId, chatUrl } = notification.data;
  let client;
  if (clientId) {
    client = await self.clients.get(clientId);
  } else if (chatUrl) {
    client = await self.clients.openWindow(chatUrl);
  } else {
    return;
  }
  client.postMessage({
    type: "chat-msg-notification-click",
    chatMsgId,
  });
  await client.focus();
  notification.close();
}
