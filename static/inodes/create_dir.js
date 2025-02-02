import { createSignal, GENERAL_ERR_MSG, replaceFragment } from "$main";

const btnShowDialog = document.getElementById("show-create-dir");
const { isRootDir } = btnShowDialog.dataset;

let dialog;
let form;
let nameInput;
let previewEl;
let btnSubmit;
let btnClose;
let errorEl;

btnShowDialog.disabled = false;

// =====================
// Events
// =====================

btnShowDialog.addEventListener("click", () => {
  if (!dialog) {
    renderDialog();
    initDialogEvents();
  }
  statusSignal.value = "idle";
});

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

  if (isRootDir) {
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
// Util
// =====================

async function submitData() {
  const pathname = location.pathname + nameInput.value;
  const resp = await fetch("/inodes/dirs", {
    method: "post",
    body: JSON.stringify({ pathname }),
  });
  if (!resp.ok) {
    errorSignal.value = await resp.text() || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
    nameInput.focus();
    return;
  }
  await replaceFragment(isRootDir ? "spaces" : "inodes");
  statusSignal.value = "closed";
}

// =====================
// Rendering
// =====================

function renderDialog() {
  const title = btnShowDialog.textContent.replace("…", "");
  btnShowDialog.insertAdjacentHTML(
    "afterend",
    `
      <dialog id="create-dir-dialog">
        <h1>${title}</h1>
        <p role="alert" class="error" hidden></p>
        <form class="basic-form">
          <label>
            Name:
            <input type="text" name="dirName" required />
            <small ${!isRootDir && "hidden"}>
              ${location.href}<output name="namePreview"></output>
            </small>
          </label>
          <footer>
            <button class="close" type="button">Cancel</button>
            <button class="submit">${title}</button>
          </footer>
        </form>
      </dialog>
    `,
  );
  dialog = document.getElementById("create-dir-dialog");
  form = dialog.querySelector("form");
  nameInput = form.elements.dirName;
  previewEl = form.elements.namePreview;
  btnSubmit = form.querySelector("button.submit");
  btnClose = form.querySelector("button.close");
  errorEl = dialog.querySelector("p.error");

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
