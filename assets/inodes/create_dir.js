import { createSignal, GENERAL_ERR_MSG, replaceFragment } from "$main";

let dialog;
let form;
let nameInput;
let previewEl;
let btnSubmit;
let btnClose;
let errorEl;

const btnShowDialog = document.getElementById("show-create-dir");
const { parentDirId, isSpace } = btnShowDialog.dataset;
const showPreview = isSpace;

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
  btnClose.onclick = () => {
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

  if (showPreview) {
    nameInput.oninput = () => {
      renderNamePreview();
    };
  }
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
  const resp = await fetch("/inodes/dirs", {
    method: "post",
    body: JSON.stringify({
      parentDirId,
      dirName: nameInput.value,
    }),
  });
  if (resp.ok) {
    await replaceFragment("inodes");
    statusSignal.value = "closed";
  } else {
    errorSignal.value = (await resp.text()) || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
    nameInput.focus();
  }
}

// =====================
// Rendering
// =====================

function insertDialog() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="create-dir-dialog">
        <h1>${btnShowDialog.textContent}</h1>
        <p id="create-dir-error" class="alert error" hidden></p>
        <form class="basic-form">
          <label>
            Name:
            <input type="text" name="dirName" required autocomplete="off" />
            <small ${showPreview ? "" : "hidden"}>
              ${location.href}<output name="namePreview">name</output>
            </small>
          </label>
          <footer>
            <button id="create-dir-close" type="button">Cancel</button>
            <button id="create-dir-submit">Create</button>
          </footer>
        </form>
      </dialog>
    `
  );
  dialog = document.getElementById("create-dir-dialog");
  form = dialog.querySelector("form");
  nameInput = form.elements.dirName;
  previewEl = form.elements.namePreview;
  btnSubmit = document.getElementById("create-dir-submit");
  btnClose = document.getElementById("create-dir-close");
  errorEl = document.getElementById("create-dir-error");

  const nameConstraints = JSON.parse(btnShowDialog.dataset.constraints);
  for (const entry of Object.entries(nameConstraints)) {
    nameInput.setAttribute(...entry);
  }
}

function renderStatusChange() {
  const submitted = statusSignal.value === "submitted";
  disableControls(submitted);
  btnSubmit.classList.toggle("spinner", submitted);
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function renderNamePreview() {
  previewEl.value = nameInput.value;
}

function disableControls(disabled) {
  btnSubmit.disabled = disabled;
  btnClose.disabled = disabled;
  nameInput.style.pointerEvents = disabled ? "none" : "auto";
}
