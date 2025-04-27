const searchParams = new URLSearchParams(self.location.search);

const dbName = searchParams.get("dbName") || "uploads";
let dbOpened;
let uploader;

const DEFAULT_CHUNK = mbToBytes(50);
const MIN_CHUNK = mbToBytes(5);
const DEFAULT_THREADS = 5;
const MAX_THREADS = 15;
const MAX_RETRIES = 5;

addEventListener("message", async (event) => {
  const { type, data } = event.data;
  if (type === "start") {
    uploader = new Uploader(data);
  } else if (type === "close") {
    await dbOpened?.promise.then((db) => db.close());
    uploader?.abort();
    self.close();
  } else if (type === "abort") {
    uploader?.abort();
  }
});

class Uploader {
  constructor(opt) {
    const userChunk = mbToBytes(opt.chunkSize || 0);
    const userThreads = opt.threadsCount;
    this.chunkSize = Math.max(userChunk || DEFAULT_CHUNK, MIN_CHUNK);
    this.threadsCount = Math.min(userThreads || DEFAULT_THREADS, MAX_THREADS);
    this.activeConnections = new Set();
    this.endpoints = opt.endpoints;
    this.dirId = opt.dirId;
    this.uploads = new Map();
    this.totalSize = 0;
    this.uploadedSize = 0;
    this.progress = { lastLogged: 0, parts: {} };
    this.aborted = false;
    this.initiate(Array.from(opt.files));
  }

  async initiate(files) {
    const uploadsInitData = [];
    const checksums = [];

    for (const file of files) {
      this.totalSize += file.size;
      const checksum = await calculateChecksum(file);
      const savedUpload = await getSavedUpload(checksum);
      checksums.push(checksum);
      uploadsInitData.push({
        fileType: file.type,
        fileName: file.name,
        numberOfParts: Math.ceil(file.size / this.chunkSize) || 1,
        savedUpload,
      });
    }

    const resp = await fetch(this.endpoints.initiate, {
      method: "post",
      body: JSON.stringify({
        uploadsInitData,
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text();
      this.sendError(msg);
      return;
    }

    const respData = await resp.json();
    this.signedUrls = respData.signedUrls;
    this.uploadedSize = respData.uploadedSize;

    respData.uploadsResult.forEach((upload, i) => {
      this.uploads.set(upload.uploadId, {
        ...upload,
        file: files[i],
        checksum: checksums[i],
      });
    });

    this.sendNext();
  }

  async sendNext(retry = 0) {
    if (this.activeConnections.size >= this.threadsCount) {
      return;
    }
    if (!this.signedUrls.length) {
      if (!this.activeConnections.size) {
        this.complete();
      }
      return;
    }
    const signedUrl = this.signedUrls.pop();
    const { searchParams } = new URL(signedUrl);
    const uploadId = searchParams.get("uploadId");
    const partNumber = Number(searchParams.get("partNumber"));
    const upload = this.uploads.get(uploadId);
    const start = (partNumber - 1) * this.chunkSize;
    const chunk = upload.file.slice(start, start + this.chunkSize);

    try {
      await this.uploadChunk({
        signedUrl,
        chunk,
        partNumber,
        upload,
        onStarted: () => this.sendNext(),
      });
      this.sendNext();
    } catch (err) {
      if (this.aborted) return;
      if (retry > MAX_RETRIES) {
        console.error(
          `Part#${partNumber} of ${upload.file.name} failed to upload, giving up`
        );
        this.abort();
        this.sendError();
        console.error(err);
        return;
      }
      const newRetry = retry + 1;
      const backOff = 2 ** newRetry * 400;

      console.warning(
        `Part#${partNumber} of ${upload.file.name} failed to upload, backing off ${backOff} before retrying...`
      );
      setTimeout(() => {
        this.signedUrls.push(signedUrl);
        this.sendNext(newRetry);
      }, backOff);
    }
  }

  uploadChunk({ signedUrl, chunk, partNumber, upload, onStarted }) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      this.activeConnections.add(xhr);
      onStarted();
      xhr.open("PUT", signedUrl);
      xhr.timeout = chunk.size * 15;

      xhr.upload.onprogress = (event) =>
        this.handleProgress({ event, signedUrl });

      xhr.onreadystatechange = async () => {
        if (xhr.readyState !== 4) return;
        this.activeConnections.delete(xhr);
        if (xhr.status !== 200) {
          reject(new Error(`Upload status ${xhr.status}`));
          return;
        }
        upload.finishedParts.push({
          partNumber,
          partSize: chunk.size,
          etag: xhr.getResponseHeader("ETag").replaceAll('"', ""),
        });
        await saveUpload(
          pick(upload, [
            "uploadId",
            "s3Key",
            "checksum",
            "createdOn",
            "finishedParts",
          ])
        );
        resolve();
      };
      xhr.send(chunk);
    });
  }

  handleProgress({ event, signedUrl }) {
    const now = Date.now();
    const { lastLogged, parts } = this.progress;

    if (now - lastLogged > 300 || event.loaded === event.total) {
      const prevLoaded = parts[signedUrl] || 0;
      parts[signedUrl] = event.loaded;

      this.progress.lastLogged = now;
      this.uploadedSize += event.loaded - prevLoaded;
      this.progress.totalMb ??= prettyMbSize(bytesToMb(this.totalSize));

      postMessage({
        type: "progress",
        data: {
          totalMb: this.progress.totalMb,
          currMb: prettyMbSize(bytesToMb(this.uploadedSize)),
          perc: ((this.uploadedSize / this.totalSize) * 100).toFixed(),
        },
      });
    }
  }

  async complete() {
    const uploads = Array.from(this.uploads.values()).map((upload) => ({
      fileName: upload.file.name,
      fileType: upload.fileType,
      ...pick(upload, ["uploadId", "s3Key", "checksum", "finishedParts"]),
    }));

    const resp = await fetch(this.endpoints.complete, {
      method: "post",
      body: JSON.stringify({
        uploads,
        dirId: this.dirId,
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text();
      this.sendError(msg);
      return;
    }

    const completedIds = await resp.json();

    await Promise.all(
      completedIds.map((id) => {
        const { checksum } = this.uploads.get(id);
        return deleteSavedUpload(checksum);
      })
    );

    postMessage({ type: "completed" });
  }

  abort() {
    this.aborted = true;
    this.activeConnections.forEach((conn) => conn.abort());
  }

  sendError(msg) {
    postMessage({ type: "error", data: { msg } });
  }
}

// =====================
// DB
// =====================

const UPLOADS_STORE = "uploads";

function openDb() {
  if (dbOpened) return dbOpened.promise;
  dbOpened = Promise.withResolvers();
  const openReq = indexedDB.open(dbName, 1);

  openReq.onsuccess = (event) => {
    const db = event.target.result;
    dbOpened.resolve(db);
    db.onclose = () => (dbOpened = null);
  };

  openReq.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
      db.createObjectStore(UPLOADS_STORE, { keyPath: "checksum" });
    }
  };
  return dbOpened.promise;
}

async function getSavedUpload(checksum) {
  const db = await openDb();
  return new Promise((resolve) => {
    db
      .transaction(UPLOADS_STORE)
      .objectStore(UPLOADS_STORE)
      .get(checksum).onsuccess = (ev) => resolve(ev.target.result);
  });
}

async function saveUpload(upload) {
  const db = await openDb();
  return new Promise((resolve) => {
    db
      .transaction(UPLOADS_STORE, "readwrite")
      .objectStore(UPLOADS_STORE)
      .put(upload).onsuccess = resolve;
  });
}

async function deleteSavedUpload(checksum) {
  const db = await openDb();
  return new Promise((resolve) => {
    db
      .transaction(UPLOADS_STORE, "readwrite")
      .objectStore(UPLOADS_STORE)
      .delete(checksum).onsuccess = resolve;
  });
}

// =====================
// Utils
// =====================

function mbToBytes(mb) {
  return 1024 * 1024 * mb;
}

function bytesToMb(bytes) {
  return bytes / (1024 * 1024);
}

async function calculateChecksum(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

function pick(obj, keys) {
  const result = {};
  for (const key of keys) if (key in obj) result[key] = obj[key];
  return result;
}

function prettyMbSize(size) {
  return size < 0.1 ? 0.1 : Number(size.toFixed(size < 1 ? 1 : 0));
}
