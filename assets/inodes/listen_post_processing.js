import { createSignal } from "$main";

export const processingSignal = createSignal();

const previewEl = document.getElementById("file-preview");
const loaderEl = document.getElementById("file-preview-loader");
const { inodeId, processingTimeout } = previewEl.dataset;
let isComplete;

const evtSource = new EventSource(`/inodes/listen-post-processing/${inodeId}`);
evtSource.onmessage = (evt) => onMessage(evt, evtSource);

if (processingTimeout) {
  setTimeout(() => {
    if (!isComplete) handleError();
  }, processingTimeout);
}

function onMessage(evt, evtSource) {
  const msg = JSON.parse(evt.data);
  const { status } = msg;
  processingSignal.value = msg;
  if (msg.close) {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleComplete(msg);
  } else if (status === "ERROR") {
    handleError();
  }
}

function handleComplete({ previewUrl, mimeType }) {
  isComplete = true;
  loaderEl.remove();
  previewEl.hidden = false;
  if (previewUrl) previewEl.src = previewUrl;
  if (mimeType) previewEl.dataset.mime = mimeType;
}

function handleError() {
  const errorEl = document.getElementById("file-preview-error");
  errorEl.hidden = false;
  previewEl.hidden = true;
  loaderEl.remove();
}
