const imageEl = document.getElementById("image");
const processingEl = document.getElementById("image-processing");
const { inodeId } = imageEl.dataset;

listenImageProcessing();

function listenImageProcessing() {
  const path = `/inodes/listen-image-processing/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => handleProcessingEvent(evt, evtSource);
  evtSource.onerror = () => listenImageProcessing();
}

function handleProcessingEvent(evt, evtSource) {
  const { status, imageUrl } = JSON.parse(evt.data);
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleCompleteMsg(imageUrl);
  } else if (status === "ERROR") {
    handleErrorMsg();
  }
}

function handleCompleteMsg(imageUrl) {
  processingEl.remove();
  imageEl.hidden = false;
  imageEl.src = imageUrl;
}

function handleErrorMsg() {
  const errorEl = document.getElementById("image-processing-error");
  errorEl.hidden = false;
  imageEl.hidden = true;
  processingEl.remove();
}
