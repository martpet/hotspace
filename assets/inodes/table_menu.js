import {
  createSignal,
  flashNow,
  GENERAL_ERR_MSG,
  replaceFragment,
} from "$main";

let dialog;
let dialogIntro;
let dialogConfirmInput;
let dialogList;
let toggler;
let selectInputs;
let selection;
let form;
let submitButton;
let closeButton;
let errorEl;

const container = document.getElementById("inodes-container");
const tableMenu = document.getElementById("inodes-table-menu");
const btnDelete = document.getElementById("inodes-table-delete-button");
const mutationObserver = new MutationObserver(onMutationObserve);
const { dirId, isSingleSelect, inodeLabel } = tableMenu.dataset;

mutationObserver.observe(container, { subtree: true, childList: true });

refreshContainerElements();

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
  if (target.matches(".select input")) {
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
  refreshContainerElements();
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
    tableMenu.hidden = true;
    flashNow(createFlashMsg());
  } else if (resp.status === 404) {
    location.reload();
  } else {
    errorSignal.value = (await resp.text()) || GENERAL_ERR_MSG;
    statusSignal.value = "idle";
  }
}

function createFlashMsg() {
  if (isSingleSelect) {
    return `${inodeLabel} "${selection[0].name}" deleted`;
  }
  if (selection.length === 1) {
    const { isDir, decodedName } = selection[0];
    return `Deleted ${isDir ? "folder" : "file"} "${decodedName}"`;
  }
  let dirsCount = 0;
  let filesCount = 0;
  for (const { isDir } of selection) isDir ? dirsCount++ : filesCount++;
  let msg = "Deleted ";
  if (dirsCount) msg += `${dirsCount} folder${dirsCount > 1 ? "s" : ""}`;
  if (dirsCount && filesCount) msg += " and ";
  if (filesCount) msg += `${filesCount} file${filesCount > 1 ? "s" : ""}`;
  return msg;
}

function handleSelectionChange(eventTarget) {
  let someSelected;
  let someUnselected;
  selection = [];
  for (const input of selectInputs) {
    if (eventTarget === toggler) input.checked = eventTarget.checked;
    if (input.checked) {
      someSelected = true;
      selection.push(getSelectInputData(input));
    } else {
      someUnselected = true;
    }
  }
  if (toggler) toggler.checked = !someUnselected;
  tableMenu.hidden = !someSelected;
}

function refreshContainerElements() {
  toggler = container.querySelector("thead .select input");
  selectInputs = container.querySelectorAll("tbody .select input");
  if (toggler) toggler.disabled = false;
  selectInputs.forEach((input) => (input.disabled = false));
}

function getSelectInputData(input) {
  if (!input.dataset.name) {
    const anchor = input.closest("tr").querySelector(".name a");
    const { pathname } = new URL(anchor.href);
    input.dataset.pathname = pathname;
    input.dataset.name = pathname.split("/").filter(Boolean).at(-1);
    input.dataset.decodedName = anchor.textContent;
    input.dataset.isDir = anchor.classList.contains("dir") ? "1" : "";
  }
  return { ...input.dataset };
}

// =====================
// Rendering
// =====================

function insertDialog() {
  const PATTERN_CONFIRM = isSingleSelect ? "" : "permanently delete";
  const confirmText = isSingleSelect
    ? `the name of the ${inodeLabel.toLowerCase()}`
    : `<em><strong>${PATTERN_CONFIRM}</strong></em> in the field`;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <dialog id="table-delete-dialog">
          <h1>Delete ${isSingleSelect ? inodeLabel : "Selected"}</h1>
          <form class="basic-form">
            <p class="alert warning">
              <span id="table-delete-intro"></span><br />
              This action cannot be undone.
            </p>
            <ul id="table-delete-list" ${isSingleSelect ? "hidden" : ""}>
            </ul>
            <p id="table-delete-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type ${confirmText}:</span>
              <input id="table-delete-confirm" type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="table-delete-close">Cancel</button>
              <button id="table-delete-submit">Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `
  );
  dialog = document.getElementById("table-delete-dialog");
  dialogIntro = document.getElementById("table-delete-intro");
  dialogConfirmInput = document.getElementById("table-delete-confirm");
  dialogList = document.getElementById("table-delete-list");
  form = dialog.querySelector("form");
  submitButton = document.getElementById("table-delete-submit");
  closeButton = document.getElementById("table-delete-close");
  errorEl = document.getElementById("table-delete-error");
}

function updateDialog() {
  const listInfo = updateDialogList();
  updateDialogIntro(listInfo);

  if (isSingleSelect) {
    dialogConfirmInput.pattern = selection[0].name;
  }
}

function updateDialogList() {
  let html = "";
  let dirsCount = 0;
  let filesCount = 0;
  for (const { isDir, decodedName, pathname } of selection) {
    isDir ? dirsCount++ : filesCount++;
    const css = `inode ${isDir ? "dir" : "file"}`;
    html += `<li><a href="${pathname}" target="_blank" class="${css}">${decodedName}</a></li>`;
  }
  dialogList.innerHTML = html;
  return { dirsCount, filesCount };
}

function updateDialogIntro({ dirsCount, filesCount }) {
  let txt;
  if (isSingleSelect) {
    const spaceName = selection[0].name;
    txt = `${inodeLabel} <strong>${spaceName}</strong> and its content will be deleted.`;
  } else {
    txt = "The following ";
    if (selection.length === 1) {
      txt += selection[0].isDir ? "folder" : "file";
    } else {
      if (filesCount) txt += `${filesCount} file${filesCount > 1 ? "s" : ""}`;
      if (filesCount && dirsCount) txt += ", ";
      if (dirsCount) txt += `${dirsCount} folder${dirsCount > 1 ? "s" : ""}`;
      if (dirsCount && filesCount) txt += ", ";
    }
    const pronoun = selection.length > 1 ? "their" : "its";
    txt += ` and ${pronoun} chat messages will be deleted.`;
  }

  dialogIntro.innerHTML = txt;
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
