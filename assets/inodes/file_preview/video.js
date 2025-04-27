const videoEl = document.getElementById("video");
const loaderEl = document.getElementById("file-preview-loader");
const { inodeId, supportsHls, playlistUrl, hlsWorkerPath } = videoEl.dataset;

if (playlistUrl) {
  loadHlsFallback(playlistUrl);
} else {
  listenFileProcessing();
}

async function loadHlsFallback(url) {
  const { isSupported, Hls } = await import("$hls");
  if (isSupported) {
    const hls = new Hls({ workerPath: hlsWorkerPath });
    hls.loadSource(url);
    hls.attachMedia(videoEl);
  }
}

function listenFileProcessing() {
  const path = `/inodes/listen-video-processing/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => handleConvertEvent(evt, evtSource);
  evtSource.onerror = () => listenFileProcessing();
}

function handleConvertEvent(evt, evtSource) {
  const { status, playlistDataUrl, percentComplete } = JSON.parse(evt.data);
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleComplete(playlistDataUrl);
  } else if (status === "ERROR") {
    handleError();
  } else if (status === "PENDING") {
    handleProgressMsg(percentComplete);
  }
}

function handleComplete(url) {
  loaderEl.remove();
  videoEl.hidden = false;
  if (supportsHls) {
    videoEl.src = url;
  } else {
    loadHlsFallback(url);
  }
}

function handleError() {
  const errorEl = document.getElementById("file-preview-error");
  errorEl.hidden = false;
  videoEl.hidden = true;
  loaderEl.remove();
}

function handleProgressMsg(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}
