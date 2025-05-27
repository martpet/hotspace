import { createSignal, GENERAL_ERR_MSG, setFlash, setFromCookie } from "$main";

const button = document.getElementById("delete-inode-button");
const { inodeName, isDir, parentDirId, isParentRoot } = button.dataset;
const inodeNameDecoded = decodeURIComponent(inodeName);
const isSpace = isParentRoot;
const inodeType = isSpace ? "Space" : isDir ? "Folder" : "File";

button.disabled = false;

let dialog;
let form;
let closeButton;
let submitButton;
let errorEl;

// =====================
// Events
// =====================

button.onclick = (e) => {
  if (!dialog) {
    insertDialog();
    initDialogEvents();
  }
  statusSignal.value = "idle";
};

function initDialogEvents() {
  closeButton.onclick = () => {
    statusSignal.value = "closed";
  };

  dialog.oncancel = (e) => {
    e.preventDefault();
    statusSignal.value = "closed";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    statusSignal.value = "submitted";
  };
}
// =====================
// Signals
// =====================

const statusSignal = createSignal("closed");
const errorSignal = createSignal("");

statusSignal.subscribe((status) => {
  renderStatusChange();

  if (status === "closed") {
    dialog.close();
    form.reset();
    errorSignal.value = "";
  } else if (status === "idle") {
    dialog.showModal();
  } else if (status === "submitted") {
    submitData();
    errorSignal.value = "";
  }
});

errorSignal.subscribe((msg) => {
  renderError(msg);
});

// =====================
// Utils
// =====================

async function submitData() {
  const resp = await fetch("/inodes/delete", {
    method: "post",
    body: JSON.stringify({
      dirId: parentDirId,
      inodesNames: [inodeName],
    }),
  });
  const parentPath = isDir ? "../" : "./";
  if (resp.ok) {
    setFlash(`Deleted ${inodeType.toLowerCase()} "${inodeNameDecoded}"`);
    setFromCookie("delete");
    location = parentPath;
  } else if (resp.status === 404) {
    setFlash({ msg: "Not Found", type: "error" });
    location = parentPath;
  } else {
    errorSignal.value = (await resp.text()) || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
  }
}

// =====================
// Rendering
// =====================

function insertDialog() {
  const introText = isDir
    ? `${inodeType} <strong>'${inodeName}'</strong> and its content`
    : `<strong>${inodeNameDecoded}</strong>  and its chat messages`;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <dialog id="delete-inode-dialog">
          <h1>Delete ${inodeType}</h1>
          <form id="delete-inode-form" class="basic-form">
            <p class="alert warning">
              ${introText} will be deleted.<br />
              <span class="text-undone">This action cannot be undone.</span>
            </p>
            <p id="delete-inode-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type the name of the ${inodeType.toLowerCase()}:</span>
              <input type="text" autofocus required pattern="${inodeNameDecoded}" />
            </label>
            <footer>
              <button type="button" id="delete-inode-close">Cancel</button>
              <button id="delete-inode-submit">Permanently Delete</button>
            </footer>
          </form>
        </dialog>
      `
  );
  dialog = document.getElementById("delete-inode-dialog");
  form = document.getElementById("delete-inode-form");
  closeButton = document.getElementById("delete-inode-close");
  submitButton = document.getElementById("delete-inode-submit");
  errorEl = document.getElementById("delete-inode-error");
}

function renderStatusChange() {
  const submitted = statusSignal.value === "submitted";
  disableControls(submitted);
  submitButton.classList.toggle("spinner", submitted);
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function disableControls(disabled) {
  submitButton.disabled = disabled;
  closeButton.disabled = disabled;
}
