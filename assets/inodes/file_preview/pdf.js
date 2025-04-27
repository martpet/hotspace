const iframeEl = document.getElementById("pdf");
const loaderEl = document.getElementById("file-preview-loader");
const { inodeId, processingTimeout } = iframeEl.dataset;
let isComplete;

setTimeout(() => {
  if (!isComplete) handleError();
}, processingTimeout);

listenFileProcessing();

function listenFileProcessing() {
  const path = `/inodes/listen-pdf-processing/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => handleProcessingEvent(evt, evtSource);
  evtSource.onerror = () => listenFileProcessing();
}

function handleProcessingEvent(evt, evtSource) {
  const { status, pdfUrl } = JSON.parse(evt.data);
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleComplete(pdfUrl);
  } else if (status === "ERROR") {
    handleError();
  }
}

function handleComplete(pdfUrl) {
  isComplete = true;
  loaderEl.remove();
  iframeEl.hidden = false;
  iframeEl.src = pdfUrl;
}

function handleError() {
  const errorEl = document.getElementById("file-preview-error");
  errorEl.hidden = false;
  iframeEl.hidden = true;
  loaderEl.remove();
}
