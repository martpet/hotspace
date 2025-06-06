const previewEl = document.getElementById("file-preview");
const { supportsHls, isProcessing, videoUrl, hlsWorkerPath } =
  previewEl.dataset;

if (!supportsHls && videoUrl) {
  loadHlsFallback(videoUrl);
}

if (isProcessing) {
  const { processingSignal } = await import("$listenPostProcessing");
  processingSignal.subscribe((data) => {
    const { status, percentComplete } = data;
    if (status === "COMPLETE") {
      handleComplete(data);
    } else if (status === "PENDING") {
      handleProgress(percentComplete);
    }
  });
}

async function loadHlsFallback(url) {
  const mod = await import("$hls");
  if (mod.isSupported) {
    const hls = new mod.Hls({ workerPath: hlsWorkerPath });
    hls.loadSource(url);
    hls.attachMedia(previewEl);
  }
}

function handleComplete({ videoUrl, width, height }) {
  setVideoStyles({ width, height });
  if (supportsHls) {
    previewEl.src = videoUrl;
  } else {
    loadHlsFallback(videoUrl);
  }
}

function handleProgress(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}

export function setVideoStyles({ width, height }) {
  const maxHeight = parseFloat(getComputedStyle(previewEl).maxHeight);
  const ratio = height / width;

  Object.assign(previewEl.style, {
    aspectRatio: `1/${ratio}`,
    width: `${Math.round(maxHeight / ratio)}px`,
  });
}
