import {
  browserName,
  createSignal,
  GENERAL_ERR_MSG,
  replaceFragment,
} from "$main";

const btnShowDialog = document.getElementById("show-upload");
const { workerSrc, dirId } = btnShowDialog.dataset;
const EXIT_MSG = "Do you really want to stop the upload?";

const endpoints = {
  initiate: "/inodes/upload/initiate",
  complete: "/inodes/upload/complete",
};

let dialog;
let form;
let btnSubmit;
let fileInput;
let btnClose;
let worker;

btnShowDialog.disabled = false;

// =====================
// Events
// =====================

btnShowDialog.onclick = () => {
  if (!dialog) {
    insertDialog();
    initDialogEvents();
  }
  statusSignal.value = "idle";
};

function initDialogEvents() {
  form.onsubmit = (e) => {
    e.preventDefault();
    statusSignal.value = "started";
  };

  btnClose.onclick = () => {
    if (statusSignal.value !== "started" || confirm(EXIT_MSG)) {
      statusSignal.value = "closed";
    }
  };

  fileInput.onchange = () => {
    errorSignal.value = "";
  };

  dialog.oncancel = (e) => {
    if (e.target !== dialog) return;
    if (statusSignal.value === "idle") {
      statusSignal.value = "closed";
    } else {
      e.preventDefault();
    }
  };
}

function workerMsgHandler(event) {
  const { type, data } = event.data;
  if (type === "progress") {
    progressSignal.value = data;
  } else if (type === "completed") {
    statusSignal.value = "completed";
  } else if (type === "error") {
    errorSignal.value = data.msg || GENERAL_ERR_MSG;
  }
}

addEventListener("offline", () => {
  onlineSignal.value = false;
});

addEventListener("online", () => {
  onlineSignal.value = true;
});

// =====================
// Signals
// =====================

const statusSignal = createSignal("closed");
const progressSignal = createSignal();
const errorSignal = createSignal("");
const onlineSignal = createSignal(navigator.onLine);

statusSignal.subscribe(async (status) => {
  renderStatusChange();

  if (status === "closed") {
    dialog.close();
    form.reset();
    errorSignal.value = "";
    worker?.postMessage({ type: "close" });
  } else if (status === "idle") {
    dialog.showModal();
    progressSignal.value = null;
  } else if (status === "started") {
    startUpload();
    progressSignal.value = { pending: true };
    errorSignal.value = "";
  } else if (status === "completed") {
    await replaceFragment("inodes");
    statusSignal.value = "closed";
  }
});

progressSignal.subscribe((val) => {
  renderProgress(val);
});

errorSignal.subscribe((msg) => {
  if (msg) statusSignal.value = "idle";
  renderError(msg);
});

onlineSignal.subscribe((isOnline) => {
  if (
    !isOnline &&
    statusSignal.value === "started" &&
    browserName === "Firefox"
  ) {
    errorSignal.value = "The network is offline, try again later";
    worker.postMessage({ type: "abort" });
  }
});

// =====================
// Utils
// =====================

function startUpload() {
  worker = new Worker(workerSrc, { type: "module" });
  worker.onmessage = workerMsgHandler;
  worker.postMessage({
    type: "start",
    data: {
      endpoints,
      files: fileInput.files,
      dirId,
    },
  });
}

// =====================
// Rendering
// =====================

function insertDialog() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="upload-dialog">
        <h1>Upload Files</h1>
        <form class="basic-form">
          <label>
            <input type="file" multiple autofocus required />
          </label>
          <footer>
            <button type="button" class="close">Cancel</button>
            <button class="submit"></button>
          </footer>
        </form>
      </dialog>
    `
  );
  dialog = document.getElementById("upload-dialog");
  form = dialog.querySelector("form");
  fileInput = form.querySelector("input[type=file]");
  btnSubmit = form.querySelector("button.submit");
  btnClose = form.querySelector("button.close");
}

function renderStatusChange() {
  const runningStatus = ["started", "completed"];
  const isRunning = runningStatus.includes(statusSignal.value);
  fileInput.disabled = isRunning;
  btnSubmit.disabled = isRunning;
  btnSubmit.textContent = isRunning ? "Uploading" : "Start Upload";
  btnSubmit.classList.toggle("spinner", isRunning);
}

function renderError(msg) {
  dialog.querySelector("p.error")?.remove();
  if (msg) {
    form.insertAdjacentHTML("beforebegin", `<p class="alert error">${msg}</p>`);
  }
}

function renderProgress(opt) {
  const el = document.getElementById("upload-progress");
  if (!opt) {
    el?.remove();
    return;
  }
  if (!el) {
    form.querySelector("footer").insertAdjacentHTML(
      "beforebegin",
      `<label id="upload-progress">
        <progress id="upload-progress-bar" value="0" max="100"></progress>
        <span class="info" id="upload-progress-info"></span>
      </label>`
    );
  }
  const { perc = 0, pending } = opt;
  const progEl = document.getElementById("upload-progress-bar");
  const infoEl = document.getElementById("upload-progress-info");
  progEl.value = perc;
  infoEl.innerText = pending ? "Starting…" : `${perc} %`;
}
