const videoEl = document.getElementById("video");

const { inodeId, workerPath, videoSrc, supportsHls, isConverted } =
  videoEl.dataset;

if (!isConverted) {
  waitConverted();
} else if (!supportsHls) {
  loadHlsFallback();
}

function waitConverted() {
  const path = `/inodes/check-video-converted/${inodeId}`;
  const evtSource = new EventSource(path);
  evtSource.onerror = () => waitConverted();
  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.ready) {
      evtSource.close();
      showVideo();
    }
  };
}

async function loadHlsFallback() {
  const { isSupported, Hls } = await import("$hls");
  if (isSupported) {
    const hls = new Hls({ workerPath });
    hls.loadSource(videoSrc);
    hls.attachMedia(videoEl);
  }
}

function showVideo() {
  const convertingEl = document.getElementById("video-converting");
  convertingEl.remove();
  videoEl.hidden = false;
  if (supportsHls) {
    videoEl.src = videoSrc;
  } else {
    loadHlsFallback();
  }
}
