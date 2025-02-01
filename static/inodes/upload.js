import { browserName, createSignal, GENERAL_ERR_MSG } from "$main";

const btnShowDialog = document.getElementById("show-upload");
const { workerSrc } = btnShowDialog.dataset;
const EXIT_MSG = "Do you really want to stop the upload?";

const endpoints = {
  initiate: "/inodes/upload/initiate",
  complete: "/inodes/upload/complete",
};

let dialog;
let form;
let btnSubmit;
let fileInput;
let btnCancel;
let worker;

btnShowDialog.disabled = false;

// =====================
// Events
// =====================

btnShowDialog.onclick = () => {
  statusSignal.value = "idle";

  if (dialog) {
    dialog.showModal();
    return;
  }

  btnShowDialog.insertAdjacentHTML(
    "afterend",
    `
      <dialog id="upload-dialog">
        <h1>Upload</h1>
        <form class="basic-form">
          <label>
            <input type="file" multiple autofocus required />
          </label>
          <footer>
            <button type="button" class="cancel">Cancel</button>
            <button class="submit">Start Upload</button>
          </footer>
        </form>
      </dialog>
    `,
  );

  dialog = document.getElementById("upload-dialog");
  form = dialog.querySelector("form");
  fileInput = form.querySelector("input[type=file]");
  btnSubmit = form.querySelector("button.submit");
  btnCancel = form.querySelector("button.cancel");

  dialog.showModal();

  dialog.onclose = () => {
    statusSignal.value = "closed";
  };

  dialog.oncancel = (e) => {
    if (statusSignal.value !== "idle") {
      e.preventDefault();
    }
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    statusSignal.value = "started";
  };

  btnCancel.onclick = () => {
    if (statusSignal.value !== "started" || confirm(EXIT_MSG)) {
      dialog.close();
    }
  };
};

addEventListener("offline", () => {
  onlineSignal.value = false;
});

addEventListener("online", () => {
  onlineSignal.value = true;
});

function onWorkerMessage(event) {
  const { type, data } = event.data;
  if (type === "error") {
    errorSignal.value = data.msg || GENERAL_ERR_MSG;
  } else if (type === "progress") {
    progressSignal.value = data;
  } else if (type === "completed") {
    statusSignal.value = "completed";
  }
}

// =====================
// Signals
// =====================

const statusSignal = createSignal("closed");
const progressSignal = createSignal();
const errorSignal = createSignal();
const onlineSignal = createSignal(navigator.onLine);

statusSignal.subscribe((status) => {
  renderStatusChange();

  if (status === "idle") {
    progressSignal.value = null;
  } else if (status === "started") {
    errorSignal.value = "";
    progressSignal.value = { isPreparing: true };
    worker = new Worker(workerSrc, { type: "module" });
    worker.onmessage = onWorkerMessage;
    worker.postMessage({
      type: "start",
      data: {
        endpoints,
        files: fileInput.files,
        pathname: location.pathname,
      },
    });
  } else if (status === "completed") {
    worker.postMessage({ type: "close" });
    location.reload();
  } else if (status === "closed") {
    worker?.postMessage({ type: "close" });
    form.reset();
  }
});

progressSignal.subscribe((val) => {
  renderProgress(val);
});

errorSignal.subscribe((errMsg) => {
  if (errMsg) statusSignal.value = "idle";
  renderError(errMsg);
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
// Rendering
// =====================

function renderStatusChange() {
  const isStarted = statusSignal.value === "started";
  fileInput.disabled = isStarted;
  btnSubmit.disabled = isStarted;
  btnSubmit.textContent = isStarted ? "Uploading" : "Start Upload";
  btnSubmit.classList.toggle("spinner", isStarted);
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
      </label>`,
    );
  }
  const { perc = 0, isPreparing } = opt;
  const progEl = document.getElementById("upload-progress-bar");
  const infoEl = document.getElementById("upload-progress-info");

  progEl.value = perc;
  infoEl.innerText = isPreparing ? "Starting…" : `${perc} %`;
}
