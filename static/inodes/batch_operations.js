import { createSignal, GENERAL_ERR_MSG, replaceFragment } from "$main";

let dialog;
let dialogIntro;
let dialogList;
let toggler;
let checkboxes;
let selection;
let form;
let btnSubmit;
let btnClose;
let errorEl;

const container = document.getElementById("inodes-container");
const btnDelete = document.getElementById("batch-delete-button");
const batchMenu = document.getElementById("batch-operations-buttons");
const observer = new MutationObserver(onMutationObserve);

observer.observe(container, {
  subtree: true,
  childList: true,
});

getContainerElements();

// =====================
// Events
// =====================

btnDelete.onclick = () => {
  if (!dialog) {
    insertDialog();
    initDialogEvents();
  }
  statusSignal.value = "idle";
};

container.onchange = ({ target }) => {
  if (target.matches("[type=checkbox]")) {
    handleSelection(target);
  }
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
}

function onMutationObserve() {
  getContainerElements();
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
    updateDialog();
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
  const pathnames = selection.map((it) => it.pathname);
  const resp = await fetch("/inodes/batch", {
    method: "delete",
    body: JSON.stringify({ pathnames }),
  });
  if (resp.ok) {
    await replaceFragment("inodes");
    statusSignal.value = "closed";
  } else if (resp.status === 404) {
    location.reload();
  } else {
    errorSignal.value = await resp.text() || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
  }
}

function handleSelection(target) {
  let hasChecked;
  let hasUnchecked;
  selection = [];
  for (const chbox of checkboxes) {
    if (target === toggler) chbox.checked = target.checked;
    if (chbox.checked) {
      hasChecked = true;
      selection.push(getChboxData(chbox));
    } else {
      hasUnchecked = true;
    }
  }
  toggler.checked = !hasUnchecked;
  batchMenu.hidden = !hasChecked;
}

function getContainerElements() {
  toggler = container.querySelector("thead .chbox input");
  checkboxes = container.querySelectorAll("tbody .chbox input");
  if (toggler) toggler.disabled = false;
  checkboxes.forEach((chbox) => chbox.disabled = false);
  if (!checkboxes.length) batchMenu.hidden = true;
}

function getChboxData(chbox) {
  if (!chbox.dataset.name) {
    const anchor = chbox.closest("tr").querySelector(".name a");
    chbox.dataset.name = anchor.textContent;
    chbox.dataset.pathname = new URL(anchor.href).pathname;
    chbox.dataset.isDir = anchor.classList.contains("dir") ? "1" : "";
  }
  return { ...chbox.dataset };
}

// =====================
// Rendering
// =====================

function insertDialog() {
  const PATTERN_CONFIRM = "permanently delete";
  btnDelete.insertAdjacentHTML(
    "afterend",
    `
        <dialog id="batch-delete-dialog">
          <h1>Delete Items</h1>
          <form action="/inodes/delete" class="basic-form">
            <p class="alert warning">
              <span id="batch-delete-intro"></span> will be deleted.<br />
              This action cannot be undone.
            </p>
            <ul id="batch-delete-list">
            </ul>
            <p id="batch-delete-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type <em>${PATTERN_CONFIRM}</em> in the box:</span>
              <input type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="batch-delete-close">Cancel</button>
              <button id="batch-delete-submit">Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `,
  );
  dialog = document.getElementById("batch-delete-dialog");
  dialogIntro = document.getElementById("batch-delete-intro");
  dialogList = document.getElementById("batch-delete-list");
  form = dialog.querySelector("form");
  btnSubmit = document.getElementById("batch-delete-submit");
  btnClose = document.getElementById("batch-delete-close");
  errorEl = document.getElementById("batch-delete-error");
}

function updateDialog() {
  const listInfo = updateDialogList();
  updateDialogIntro(listInfo);
}

function updateDialogList() {
  let html = "";
  let dirsCount = 0;
  let filesCount = 0;
  for (const { isDir, name, pathname } of selection) {
    isDir ? dirsCount++ : filesCount++;
    const css = `inode ${isDir ? "dir" : "file"}`;
    html +=
      `<li><a href="${pathname}" target="_blank" class="${css}">${name}</a></li>`;
  }
  dialogList.innerHTML = html;
  return { dirsCount, filesCount };
}

function updateDialogIntro({ dirsCount, filesCount }) {
  let txt = "The following ";
  if (selection.length === 1) {
    txt += selection[0].isDir ? "folder" : "file";
  } else {
    if (filesCount) txt += `${filesCount} file${filesCount > 1 ? "s" : ""}`;
    if (filesCount && dirsCount) txt += ", ";
    if (dirsCount) txt += `${dirsCount} folder${dirsCount > 1 ? "s" : ""}`;
    if (dirsCount && filesCount) txt += ", ";
  }
  txt += ` and ${selection.length > 1 ? "their" : "its"} chat messages`;
  dialogIntro.textContent = txt;
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

function disableControls(disabled) {
  btnSubmit.disabled = disabled;
  btnClose.disabled = disabled;
}
