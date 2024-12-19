const CHAT_SUBSCRIPTIONS = "chat_subscriptions";
const CONFIG = "config";

let opened;

function open() {
  if (opened) return opened.promise;
  opened = Promise.withResolvers();
  const request = indexedDB.open("hotspace", 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(CONFIG)) {
      db.createObjectStore(CONFIG);
    }
    if (!db.objectStoreNames.contains(CHAT_SUBSCRIPTIONS)) {
      db.createObjectStore(CHAT_SUBSCRIPTIONS, { keyPath: "chatId" });
    }
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    opened.resolve(db);
    db.onclose = () => opened = null;
  };

  return opened.promise;
}

/**
 * Subscriber
 */

export async function getSubscriber() {
  const db = await open();
  return new Promise((resolve) => {
    db.transaction(CONFIG)
      .objectStore(CONFIG)
      .get("subscriber").onsuccess = (ev) => resolve(ev.target.result);
  });
}

export async function setSubscriber(subscriber) {
  const db = await open();
  return new Promise((resolve) => {
    db.transaction(CONFIG, "readwrite")
      .objectStore(CONFIG)
      .put(subscriber, "subscriber").onsuccess = resolve;
  });
}

/**
 * Chat Subscription
 */

export async function getChatSub(chatId) {
  const db = await open();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBSCRIPTIONS)
      .objectStore(CHAT_SUBSCRIPTIONS)
      .get(chatId).onsuccess = (ev) => resolve(ev.target.result);
  });
}

export async function setChatSub(data) {
  const db = await open();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBSCRIPTIONS, "readwrite")
      .objectStore(CHAT_SUBSCRIPTIONS)
      .put(data).onsuccess = resolve;
  });
}

export async function deleteChatSub(chatId) {
  const db = await open();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBSCRIPTIONS, "readwrite")
      .objectStore(CHAT_SUBSCRIPTIONS)
      .delete(chatId).onsuccess = resolve;
  });
}
