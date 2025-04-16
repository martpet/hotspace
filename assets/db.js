const CHAT_SUBS = "chat_subscriptions";
const CONFIG = "config";

let dbOpened;

function openDb() {
  if (dbOpened) return dbOpened.promise;
  dbOpened = Promise.withResolvers();
  const openReq = indexedDB.open("hotspace", 1);

  openReq.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(CONFIG)) {
      db.createObjectStore(CONFIG);
    }
    if (!db.objectStoreNames.contains(CHAT_SUBS)) {
      db.createObjectStore(CHAT_SUBS, { keyPath: "chatId" });
    }
  };

  openReq.onsuccess = (event) => {
    const db = event.target.result;
    dbOpened.resolve(db);
    db.onclose = () => dbOpened = null;
  };

  return dbOpened.promise;
}

// =====================
// Push Subscriber
// =====================

export async function getSubscriber() {
  const db = await openDb();
  return new Promise((resolve) => {
    db.transaction(CONFIG)
      .objectStore(CONFIG)
      .get("subscriber").onsuccess = (ev) => resolve(ev.target.result);
  });
}

export async function setSubscriber(subscriber) {
  const db = await openDb();
  return new Promise((resolve) => {
    db.transaction(CONFIG, "readwrite")
      .objectStore(CONFIG)
      .put(subscriber, "subscriber").onsuccess = resolve;
  });
}

// =====================
// Chat Subs
// =====================

export async function getChatSub(chatId) {
  const db = await openDb();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBS)
      .objectStore(CHAT_SUBS)
      .get(chatId).onsuccess = (ev) => resolve(ev.target.result);
  });
}

export async function setChatSub(data) {
  const db = await openDb();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBS, "readwrite")
      .objectStore(CHAT_SUBS)
      .put(data).onsuccess = resolve;
  });
}

export async function deleteChatSub(chatId) {
  const db = await openDb();
  return new Promise((resolve) => {
    db.transaction(CHAT_SUBS, "readwrite")
      .objectStore(CHAT_SUBS)
      .delete(chatId).onsuccess = resolve;
  });
}
