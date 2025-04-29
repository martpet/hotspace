import { createSignal } from "$main";

export const processingSignal = createSignal();

const previewEl = document.getElementById("file-preview");
const loaderEl = document.getElementById("file-preview-loader");
const { inodeId, processingTimeout } = previewEl.dataset;
let isComplete;

listenProcessing();

if (processingTimeout) {
  setTimeout(() => {
    if (!isComplete) handleError();
  }, processingTimeout);
}

function listenProcessing() {
  const path = `/inodes/listen-post-processing/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => onMessage(evt, evtSource);
  evtSource.onerror = () => listenProcessing();
}

function onMessage(evt, evtSource) {
  const msg = JSON.parse(evt.data);
  const { status, previewUrl } = msg;
  processingSignal.value = msg;
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleComplete(previewUrl);
  } else if (status === "ERROR") {
    handleError();
  }
}

function handleComplete(previewUrl) {
  isComplete = true;
  loaderEl.remove();
  previewEl.hidden = false;
  if (previewUrl) previewEl.src = previewUrl;
}

function handleError() {
  const errorEl = document.getElementById("file-preview-error");
  errorEl.hidden = false;
  previewEl.hidden = true;
  loaderEl.remove();
}
