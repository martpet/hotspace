import {
  GENERAL_ERR_MSG,
  authenticate,
  createSignal,
  setFlash,
  userUsername,
} from "$main";

const btnShow = document.getElementById("show-delete-account");
btnShow.disabled = false;

let dialog;
let errorEl;
let loaderEl;
let form;
let inputConfirm;
let btnSubmit;
let btnCancel;

// =====================
// Events
// =====================

btnShow.onclick = () => {
  if (!dialog) initDialog();
  dialogSignal.value = "idle";
};

// =====================
// Init Dialog
// =====================

function initDialog() {
  insertDialog();

  btnCancel.onclick = () => {
    dialogSignal.value = "closed";
  };

  dialog.oncancel = (e) => {
    e.preventDefault();
    dialogSignal.value = "closed";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    dialogSignal.value = "submitted";
  };
}

// =====================
// Signals
// =====================

const dialogSignal = createSignal("closed");

dialogSignal.subscribe((status) => {
  renderSubmitted(status === "submitted");
  renderDeleting(status === "deleting");

  if (status === "idle") {
    dialog.showModal();
  } else if (status === "submitted") {
    renderError(null);
    handleSubmit();
  } else if (status === "closed") {
    dialog.close();
    renderError(null);
  }
});

// =====================
// Submit
// =====================

async function handleSubmit() {
  try {
    const authed = await authenticate();
    if (!authed) {
      dialogSignal.value = "idle";
      return;
    }
    dialogSignal.value = "deleting";
    const resp = await fetch("/account", { method: "delete" });
    if (!resp.ok) throw new Error(GENERAL_ERR_MSG);
    setFlash(`The account for user "${userUsername}" has been deleted.`);
    location = "/";
  } catch (err) {
    renderError(err.message);
    dialogSignal.value = "idle";
  }
}

// =====================
// Rendering
// =====================

function insertDialog() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="delete-acount-dialog">
        <h1>Delete Your Account</h1>
        <p id="delete-account-loader" class="spinner-lg spinner-col" hidden></p>
        <p id="delete-account-error" class="alert error" hidden></p>
        <form class="basic-form">
          <p class="alert warning">
            Your account, files, and chat messages will be deleted.<br />
            <strong>This action cannot be undone.</strong>
          </p>
          <label>
            <span>To confirm, type your username:</span>
            <input type="text" id="delete-account-confirm" required autofocus pattern="${userUsername}"/>
          </label>
          <footer>
            <button id="delete-acount-cancel" type="button">Cancel</button>
            <button id="delete-acount-submit">Permanently Delete Account</button>
          </footer>
        </form>
      </dialog>
    `
  );
  dialog = document.getElementById("delete-acount-dialog");
  errorEl = document.getElementById("delete-account-error");
  loaderEl = document.getElementById("delete-account-loader");
  inputConfirm = document.getElementById("delete-account-confirm");
  btnSubmit = document.getElementById("delete-acount-submit");
  btnCancel = document.getElementById("delete-acount-cancel");
  form = dialog.querySelector("form");
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function renderSubmitted(flag) {
  btnSubmit.classList.toggle("spinner", flag);
  btnSubmit.disabled = flag;
  btnCancel.disabled = flag;
  inputConfirm.disabled = flag;
}

function renderDeleting(flag) {
  form.hidden = flag;
  loaderEl.hidden = !flag;
  loaderEl.textContent = flag ? "Deleting Account" : null;
}
