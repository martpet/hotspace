const videoEl = document.getElementById("video");
const convertingEl = document.getElementById("video-converting");

const { videoUrl, inodeId, supportsHls, workerPath } = videoEl.dataset;

if (videoUrl) {
  loadHlsFallback(videoUrl);
} else {
  waitMediaConvertEvent();
}

async function loadHlsFallback(url) {
  const { isSupported, Hls } = await import("$hls");
  if (isSupported) {
    const hls = new Hls({ workerPath });
    hls.loadSource(url);
    hls.attachMedia(videoEl);
  }
}

function waitMediaConvertEvent() {
  const path = `/inodes/listen-media-convert-event/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onerror = () => waitMediaConvertEvent();
  evtSource.onmessage = (evt) => handleConvertEvent(evt, evtSource);
}

function handleConvertEvent(evt, evtSource) {
  const { status, playlistDataUrl, percentComplete } = JSON.parse(evt.data);
  if (status === "COMPLETE") {
    onComplete(playlistDataUrl);
    evtSource.close();
  } else if (status === "ERROR") {
    onError();
    evtSource.close();
  } else {
    onProgress(percentComplete);
  }
}

function onComplete(url) {
  convertingEl.remove();
  videoEl.hidden = false;
  if (supportsHls) {
    videoEl.src = url;
  } else {
    loadHlsFallback(url);
  }
}

function onError() {
  const errorEl = document.getElementById("converting-error");
  errorEl.hidden = false;
  convertingEl.remove();
}

function onProgress(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}
