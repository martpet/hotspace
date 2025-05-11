import { createPushSub, syncPushSub } from "./pushsub.js";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  if (self.registration.pushManager) {
    if (event.newSubscription) {
      event.waitUntil(syncPushSub());
    } else {
      event.waitUntil(createPushSub({ forceNew: true }));
    }
  }
});

self.addEventListener("push", (event) => {
  const data = event.data.json();
  if (data.type === "test-notification") {
    event.waitUntil(
      showNotification({
        title: "Test notification",
        body: "Please, ignore. Thank you!",
      })
    );
  } else if (data.type === "new-chat-msg") {
    event.waitUntil(
      showNewChatMsgNotification({
        chatTitle: data.chatTitle,
        chatMsgId: data.chatMsgId,
        chatPageUrl: data.chatPageUrl,
      })
    );
  }
});

self.addEventListener("message", (event) => {
  const { data } = event;
  if (data.type === "new-chat-msg") {
    event.waitUntil(
      showNewChatMsgNotification({
        chatTitle: data.chatTitle,
        chatMsgId: data.chatMsgId,
        clientId: event.source.id,
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  const { notification } = event;
  const data = notification.data || {};
  if (data.type === "chat-msg-notification") {
    event.waitUntil(handleChatMsgNotificationClick(notification));
  }
});

function showNewChatMsgNotification({
  chatTitle,
  chatMsgId,
  chatPageUrl,
  clientId,
}) {
  return showNotification({
    title: `New message in '${chatTitle}'`,
    data: {
      type: "chat-msg-notification",
      chatMsgId,
      chatPageUrl,
      clientId,
    },
  });
}

async function showNotification({ title, body, data }) {
  return self.registration.showNotification(title, {
    body,
    data,
    icon: "/assets/img/logo.png",
  });
}

async function handleChatMsgNotificationClick(notification) {
  const { chatMsgId, clientId, chatPageUrl } = notification.data;
  let client;
  if (clientId) {
    client = await self.clients.get(clientId);
  } else if (chatPageUrl) {
    client = await self.clients.openWindow(chatPageUrl);
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
