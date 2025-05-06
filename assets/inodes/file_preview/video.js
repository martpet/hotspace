const previewEl = document.getElementById("file-preview");
const { supportsHls, isProcessing, videoUrl, hlsWorkerPath } =
  previewEl.dataset;

if (!supportsHls && videoUrl) {
  loadHlsFallback(videoUrl);
}

if (isProcessing) {
  const { processingSignal } = await import("$listenPostProcessing");
  processingSignal.subscribe((data) => {
    const { status, videoUrl, percentComplete } = data;
    if (status === "COMPLETE") {
      handleComplete(videoUrl);
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

function handleComplete(url) {
  if (supportsHls) {
    previewEl.src = url;
  } else {
    loadHlsFallback(url);
  }
}

function handleProgress(perc) {
  if (!perc) return;
  const percEl = document.getElementById("progress-perc");
  percEl.textContent = perc + "%";
}
