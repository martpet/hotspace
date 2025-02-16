import { createSignal, GENERAL_ERR_MSG } from "$main";

const button = document.getElementById("delete-button");

let dialog;
let form;
let closeButton;
let submitButton;
let errorEl;

button.disabled = false;

// =====================
// Events
// =====================

button.onclick = () => {
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

// =====================
// Utils
// =====================

async function submitData() {
  const pathSegments = location.pathname.split("/");
  const fileName = pathSegments.pop();
  const pathname = pathSegments.join("/");
  const resp = await fetch("/inodes/delete", {
    method: "post",
    body: JSON.stringify({ pathname, inodesNames: [fileName] }),
  });
  if (resp.ok || resp.status === 404) {
    location = "./";
  } else {
    errorSignal.value = await resp.text() || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
  }
}

// =====================
// Rendering
// =====================

function insertDialog() {
  const { fileName } = button.dataset;
  const PATTERN_CONFIRM = "permanently delete";
  button.insertAdjacentHTML(
    "afterend",
    `
        <dialog id="delete-file-dialog">
          <h1>Delete File</h1>
          <form id="delete-file-form" class="basic-form">
            <p class="alert warning">
              <strong>${fileName}</strong> and its chat messages will be deleted.<br />
              This action cannot be undone.
            </p>
            <p id="delete-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type <em>${PATTERN_CONFIRM}</em> in the box:</span>
              <input type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="delete-file-close">Cancel</button>
              <button id="delete-file-submit">Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `,
  );
  dialog = document.getElementById("delete-file-dialog");
  form = document.getElementById("delete-file-form");
  closeButton = document.getElementById("delete-file-close");
  submitButton = document.getElementById("delete-file-submit");
  errorEl = document.getElementById("delete-file-error");
  statusSignal.value = "closed";
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
