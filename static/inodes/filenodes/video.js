const videoEl = document.getElementById("video");
const convertingEl = document.getElementById("video-converting");
const { videoUrl, inodeId, supportsHls, hlsWorkerPath } = videoEl.dataset;

if (videoUrl) {
  loadHlsFallback(videoUrl);
} else {
  listenVideoConverting();
}

async function loadHlsFallback(url) {
  const { isSupported, Hls } = await import("$hls");
  if (isSupported) {
    const hls = new Hls({ workerPath: hlsWorkerPath });
    hls.loadSource(url);
    hls.attachMedia(videoEl);
  }
}

function listenVideoConverting() {
  const path = `/inodes/listen-video-converting/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onmessage = (evt) => handleConvertEvent(evt, evtSource);
  evtSource.onerror = () => listenVideoConverting();
}

function handleConvertEvent(evt, evtSource) {
  const { status, playlistDataUrl, percentComplete } = JSON.parse(evt.data);
  if (status !== "PENDING") {
    evtSource.close();
  }
  if (status === "COMPLETE") {
    handleCompleteMsg(playlistDataUrl);
  } else if (status === "ERROR") {
    handleErrorMsg();
  } else if (status === "PENDING") {
    handleProgressMsg(percentComplete);
  }
}

function handleCompleteMsg(url) {
  convertingEl.remove();
  videoEl.hidden = false;
  if (supportsHls) {
    videoEl.src = url;
  } else {
    loadHlsFallback(url);
  }
}

function handleErrorMsg() {
  const errorEl = document.getElementById("video-converting-error");
  errorEl.hidden = false;
  convertingEl.remove();
}

function handleProgressMsg(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}
