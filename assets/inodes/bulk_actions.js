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
let toggleAllInput;
let rowSelectInputs;
let selection;
let form;
let submitButton;
let closeButton;
let errorEl;

const inodesContainer = document.getElementById("inodes-container");
const actionsMenu = document.getElementById("bulk-actions");
const btnDelete = document.getElementById("bulk-delete-button");
const { dirId, isSingleSelect, inodeLabel } = actionsMenu.dataset;

refreshContainerElements();

// =====================
// Events
// =====================

new MutationObserver(() => {
  refreshContainerElements();
}).observe(inodesContainer, {
  subtree: true,
  childList: true,
});

btnDelete.onclick = () => {
  if (!dialog) {
    insertDialog();
    initDialogEvents();
  }
  dialogSignal.value = "idle";
};

inodesContainer.onchange = ({ target }) => {
  if (target.matches(".select input")) {
    handleSelectionChange(target);
  }
};

function initDialogEvents() {
  closeButton.onclick = () => {
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
const errorSignal = createSignal("");

dialogSignal.subscribe((status) => {
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
    dialogSignal.value = "closed";
    actionsMenu.hidden = true;
    flashNow(createFlashMsg());
  } else if (resp.status === 404) {
    location.reload();
  } else {
    errorSignal.value = (await resp.text()) || GENERAL_ERR_MSG;
    dialogSignal.value = "idle";
  }
}

function createFlashMsg() {
  if (isSingleSelect) {
    return `Deleted ${inodeLabel.toLocaleLowerCase()} "${selection[0].name}"`;
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
  for (const input of rowSelectInputs) {
    if (eventTarget === toggleAllInput) input.checked = eventTarget.checked;
    if (input.checked) {
      someSelected = true;
      selection.push(getSelectInputData(input));
    } else {
      someUnselected = true;
    }
  }
  if (toggleAllInput) toggleAllInput.checked = !someUnselected;
  actionsMenu.hidden = !someSelected;
}

function refreshContainerElements() {
  toggleAllInput = inodesContainer.querySelector("thead .select input");
  rowSelectInputs = inodesContainer.querySelectorAll("tbody .select input");
  if (toggleAllInput) toggleAllInput.disabled = false;
  rowSelectInputs.forEach((input) => (input.disabled = false));
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
        <dialog id="bulk-delete-dialog">
          <h1>Delete ${isSingleSelect ? inodeLabel : "Selected"}</h1>
          <form class="basic">
            <p class="alert warning">
              <span id="bulk-delete-intro"></span><br />
              This action cannot be undone.
            </p>
            <ul id="bulk-delete-items-list" ${isSingleSelect ? "hidden" : ""}>
            </ul>
            <p id="bulk-delete-error" class="alert error" hidden></p>
            <label>
              <span>To confirm, type ${confirmText}:</span>
              <input id="bulk-delete-confirm" type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="bulk-delete-close">Cancel</button>
              <button id="bulk-delete-submit">Permanently Delete</button>
            </footer>
          </form>
        </dialog>
      `
  );
  dialog = document.getElementById("bulk-delete-dialog");
  dialogIntro = document.getElementById("bulk-delete-intro");
  dialogConfirmInput = document.getElementById("bulk-delete-confirm");
  dialogList = document.getElementById("bulk-delete-items-list");
  form = dialog.querySelector("form");
  submitButton = document.getElementById("bulk-delete-submit");
  closeButton = document.getElementById("bulk-delete-close");
  errorEl = document.getElementById("bulk-delete-error");
}

function updateDialog() {
  const listInfo = renderDialogList();
  renderDialogIntro(listInfo);

  if (isSingleSelect) {
    dialogConfirmInput.pattern = selection[0].name;
  }
}

function renderDialogList() {
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

function renderDialogIntro({ dirsCount, filesCount }) {
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
  const submitted = dialogSignal.value === "submitted";
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
