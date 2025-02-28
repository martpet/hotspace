import { createSignal, GENERAL_ERR_MSG, replaceFragment } from "$main";

let dialog;
let dialogIntro;
let dialogList;
let toggler;
let checkboxes;
let selection;
let form;
let submitButton;
let closeButton;
let errorEl;

const btnDelete = document.getElementById("batch-delete-button");
const container = document.getElementById("inodes-container");
const batchMenu = document.getElementById("batch-operations-buttons");
const mutationObserver = new MutationObserver(onMutationObserve);
const { dirId } = btnDelete.dataset;

mutationObserver.observe(container, {
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
    handleSelectionChange(target);
  }
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
// Utils
// =====================

async function submitData() {
  const inodesNames = selection.map((it) => it.name);
  const resp = await fetch("/inodes/delete", {
    method: "post",
    body: JSON.stringify({
      dirId,
      inodesNames,
    }),
  });
  if (resp.ok) {
    await replaceFragment("inodes");
    statusSignal.value = "closed";
    batchMenu.hidden = true;
  } else if (resp.status === 404) {
    location.reload();
  } else {
    errorSignal.value = await resp.text() || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
  }
}

function handleSelectionChange(target) {
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
}

function getChboxData(chbox) {
  if (!chbox.dataset.name) {
    const anchor = chbox.closest("tr").querySelector(".name a");
    const { pathname } = new URL(anchor.href);
    chbox.dataset.pathname = pathname;
    chbox.dataset.name = pathname.split("/").filter(Boolean).at(-1);
    chbox.dataset.decodedName = anchor.textContent;
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
          <form class="basic-form">
            <p class="alert warning">
              <span id="batch-delete-intro"></span> will be deleted.<br />
              This action cannot be undone.
            </p>
            <ul id="batch-delete-list">
            </ul>
            <p id="batch-delete-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type <em><strong>${PATTERN_CONFIRM}</strong></em> in the field:</span>
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
  submitButton = document.getElementById("batch-delete-submit");
  closeButton = document.getElementById("batch-delete-close");
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
  for (const { isDir, decodedName, pathname } of selection) {
    isDir ? dirsCount++ : filesCount++;
    const css = `inode ${isDir ? "dir" : "file"}`;
    html +=
      `<li><a href="${pathname}" target="_blank" class="${css}">${decodedName}</a></li>`;
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
