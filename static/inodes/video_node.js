const videoEl = document.getElementById("video");
const convertingEl = document.getElementById("video-converting");

const { inodeId, workerPath, videoSrc, supportsHls, isConverting } =
  videoEl.dataset;

if (isConverting) {
  waitConverted();
} else if (!supportsHls) {
  loadHlsFallback();
}

function waitConverted() {
  const path = `/inodes/check-video-converted/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onerror = () => waitConverted();
  evtSource.onmessage = (evt) => handleConvertEvent(evt, evtSource);
}

async function loadHlsFallback() {
  const { isSupported, Hls } = await import("$hls");
  if (isSupported) {
    const hls = new Hls({ workerPath });
    hls.loadSource(videoSrc);
    hls.attachMedia(videoEl);
  }
}

function handleConvertEvent(evt, evtSource) {
  const data = JSON.parse(evt.data);
  if (data.status === "COMPLETE") {
    evtSource.close();
    showVideo();
  } else if (data.status === "ERROR") {
    evtSource.close();
    showError();
  } else {
    updateProgress(data.jobPercentComplete);
  }
}

function showVideo() {
  convertingEl.remove();
  videoEl.hidden = false;
  if (supportsHls) {
    videoEl.src = videoSrc;
  } else {
    loadHlsFallback();
  }
}

function showError() {
  const errorEl = document.getElementById("converting-error");
  errorEl.hidden = false;
  convertingEl.remove();
}

function updateProgress(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}
