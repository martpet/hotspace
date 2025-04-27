const imageEl = document.getElementById("image");
const loaderEl = document.getElementById("file-preview-loader");
const { inodeId, processingTimeout } = imageEl.dataset;
let isComplete;

setTimeout(() => {
  if (!isComplete) handleError();
}, processingTimeout);

listenFileProcessing();

function listenFileProcessing() {
  const path = `/inodes/listen-image-processing/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => handleProcessingEvent(evt, evtSource);
  evtSource.onerror = () => listenFileProcessing();
}

function handleProcessingEvent(evt, evtSource) {
  const { status, imageUrl } = JSON.parse(evt.data);
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleComplete(imageUrl);
  } else if (status === "ERROR") {
    handleError();
  }
}

function handleComplete(imageUrl) {
  let isComplete;
  loaderEl.remove();
  imageEl.hidden = false;
  imageEl.src = imageUrl;
}

function handleError() {
  const errorEl = document.getElementById("file-preview-error");
  errorEl.hidden = false;
  imageEl.hidden = true;
  loaderEl.remove();
}
