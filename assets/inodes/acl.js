import {
  createSignal,
  GENERAL_ERR_MSG,
  insertFlash,
  replaceFragment,
  userUsername,
} from "$main";

let dialog;
let form;
let buttonAddUser;
let buttonSubmit;
let buttonClose;
let errorEl;
let inodeId;
let inodeName;
let inodeLabel;
let aclRoot;
let aclLoader;
let hasPubAccess;
let pubAccessCheckbox;

const SHOW_DIALOG_SELECTOR = "button.inode-edit-acl";

const observer = new MutationObserver(handleMutation);
const container = document.getElementById("inodes-container");
observer.observe(container, { subtree: true, childList: true });

enableShowDialogButtons();

// =====================
// Signals
// =====================

const statusSignal = createSignal("closed");
const errorSignal = createSignal("");
const aclSignal = createSignal();

statusSignal.subscribe((status) => {
  showSubmitting(status === "submitted");

  if (status === "idle") {
    dialog.showModal();
  } else if (status === "closed") {
    dialog.remove();
    errorSignal.value = "";
  } else if (status === "submitted") {
    errorSignal.value = "";
    submitChanges();
  }
});

aclSignal.subscribe((acl) => {
  renderAcl();
});

errorSignal.subscribe((msg) => {
  renderError(msg);
});

// =====================
// Listeners & Handlers
// =====================

addEventListener("click", async ({ target }) => {
  if (target.matches(SHOW_DIALOG_SELECTOR)) {
    init(target);
  } else if (target.matches("button.acl-remove-item")) {
    removeAclItem(target.closest(".acl-item"));
  }
});

function initListeners() {
  buttonAddUser.onclick = () => {
    insertAclItem();
  };

  buttonClose.onclick = () => {
    statusSignal.value = "closed";
  };

  dialog.oncancel = (e) => {
    e.preventDefault();
    statusSignal.value = "closed";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    if (checkFormValid()) {
      statusSignal.value = "submitted";
    }
  };
}

function handleMutation() {
  enableShowDialogButtons();
}

// =====================
// Utils
// =====================

async function init(button) {
  const { dataset } = button;
  hasPubAccess = Boolean(dataset.hasPubAccess);
  ({ inodeId, inodeLabel } = dataset);
  inodeName = button.closest("tr").querySelector(".name").textContent;
  insertDialog();
  initListeners();
  statusSignal.value = "idle";
  if (dataset.acl) {
    aclSignal.value = JSON.parse(dataset.acl);
  } else {
    fetchAcl();
  }
}

async function fetchAcl() {
  disableControls(true);
  aclLoader.hidden = false;
  buttonAddUser.hidden = true;
  const resp = await fetch(`/inodes/acl-preview/${inodeId}`);
  if (resp.ok) {
    buttonAddUser.hidden = false;
    disableControls(false);
    aclSignal.value = await resp.json();
  } else {
    errorSignal.value = "Error loading access settings, try again";
    buttonClose.disabled = false;
  }
  aclLoader.hidden = true;
}

async function submitChanges() {
  const diffs = getDiffs();
  if (!diffs.length) {
    insertFlash({ type: "info", msg: "No changes" });
    statusSignal.value = "closed";
    return;
  }
  const resp = await fetch("/inodes/acl", {
    method: "post",
    body: JSON.stringify({
      inodeId,
      diffsWithUsername: diffs,
    }),
  });
  if (!resp.ok) {
    errorSignal.value = GENERAL_ERR_MSG;
    statusSignal.value = "idle";
    return;
  }
  const { notFoundIntroducedUsernames } = await resp.json();
  if (notFoundIntroducedUsernames.length) {
    statusSignal.value = "idle";
    handleNotFoundUsernames(notFoundIntroducedUsernames);
    return;
  }
  await replaceFragment("inodes");
  insertFlash("Changes saved");
  statusSignal.value = "closed";
}

function checkFormValid() {
  const usernamesInputs = aclRoot.querySelectorAll("input.username");
  for (const input of usernamesInputs) {
    const isAlreadyAdded = aclSignal.value[input.value] !== undefined;
    if (isAlreadyAdded) {
      input.setCustomValidity("This user is already added");
      input.reportValidity();
      return false;
    }
  }
  return true;
}

function handleNotFoundUsernames(usernames) {
  const usernamesInputs = aclRoot.querySelectorAll("input.username");
  usernamesInputs.forEach((input, i) => {
    if (usernames.includes(input.value)) {
      input.setCustomValidity("User doesn't exist");
      if (i === 0) input.reportValidity();
    }
  });
}

function getDiffs() {
  const diffs = [];
  const newPubAccess = pubAccessCheckbox.checked;
  if (newPubAccess !== hasPubAccess) {
    const username = "*";
    const role = newPubAccess ? "viewer" : null;
    diffs.push({ username, role });
  }
  const aclElements = aclRoot.querySelectorAll(".acl-item");
  for (const aclEl of aclElements) {
    if (aclEl.classList.contains("removed-acl-item")) {
      const username = aclEl.querySelector(".username").textContent;
      diffs.push({ username, role: null });
      continue;
    }
    const role = aclEl.querySelector(".roles").selectedOptions[0].value;
    if (aclEl.classList.contains("new-acl-item")) {
      const username = aclEl.querySelector(".username").value;
      diffs.push({ username, role });
      continue;
    }
    const username = aclEl.querySelector(".username").textContent;
    const isEdited = role !== aclSignal.value[username];
    if (isEdited) diffs.push({ username, role });
  }
  return diffs;
}

// =====================
// Rendering
// =====================

function insertDialog() {
  const pubAccessCheckAttr = hasPubAccess ? "checked" : "";

  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <dialog id="acl-dialog">
          <h1>Edit Access</h1>
          <p class="inode-name">${inodeLabel} "${inodeName}"</p>
          <form id="acl-form" class="basic-form">
            <p id="acl-error" class="alert error" hidden></p>
            <p>
              <label>
                <input id="pub-acl" type="checkbox" ${pubAccessCheckAttr} />
                Public access
              </label>
            </p>
            <fieldset class="permissions">
              <legend>Users</legend>
              <div id="acl-items"></div>
              <button id="acl-add-user" type="button">+ Add User</button>
              <p hidden id="acl-loading"><span class="spinner-sm"></span>Loading</p>
            </fieldset>
            <footer>
              <button type="button" id="acl-close">Cancel</button>
              <button id="acl-submit">Save Changes</button>
            </footer>
          </form>
        </dialog>
      `
  );
  dialog = document.getElementById("acl-dialog");
  form = document.getElementById("acl-form");
  aclRoot = document.getElementById("acl-items");
  aclLoader = document.getElementById("acl-loading");
  buttonAddUser = document.getElementById("acl-add-user");
  buttonSubmit = document.getElementById("acl-submit");
  buttonClose = document.getElementById("acl-close");
  pubAccessCheckbox = document.getElementById("pub-acl");
  errorEl = document.getElementById("acl-error");
}

function renderAcl() {
  const sortCurrentUserFirst = ([name]) => (name === userUsername ? -1 : 0);
  const entries = Object.entries(aclSignal.value).sort(sortCurrentUserFirst);
  const elements = entries.map((aclItem) => createAclEl(aclItem));
  aclRoot.replaceChildren(...elements);
}

function createAclEl(aclItem) {
  const aclEl = document.createElement("label");
  aclEl.classList.add("acl-item");
  const [aclUsername, aclRole] = aclItem || [];
  if (aclItem) {
    aclEl.innerHTML = `
      <span class="username">${aclUsername}</span>
      ${createRoleSelectHtml({ aclUsername, aclRole })}
    `;
  } else {
    aclEl.classList.add("new-acl-item");
    const inputEl = document.createElement("input");
    const clearCustomValidity = () => inputEl.setCustomValidity("");
    inputEl.className = "username";
    inputEl.type = "text";
    inputEl.required = true;
    inputEl.placeholder = "user";
    inputEl.autocomplete = "off";
    inputEl.autocapitalize = "off";
    inputEl.spellcheck = false;
    inputEl.addEventListener("input", clearCustomValidity);
    aclEl.append(inputEl);
    aclEl.insertAdjacentHTML(
      "beforeend",
      createRoleSelectHtml({ withPrompt: true })
    );
  }
  if (aclUsername !== userUsername) {
    aclEl.insertAdjacentHTML(
      "beforeend",
      '<button type="button" class="acl-remove-item">Remove</button>'
    );
  }
  return aclEl;
}

function insertAclItem() {
  const aclEl = createAclEl();
  aclRoot.append(aclEl);
  aclEl.focus();
}

function removeAclItem(aclEl) {
  if (aclEl.classList.contains("new-acl-item")) {
    aclEl.remove();
  } else {
    aclEl.hidden = true;
    aclEl.classList.add("removed-acl-item");
  }
}

function createRoleSelectHtml(options = {}) {
  const { aclUsername, aclRole, withPrompt } = options;
  const ACL_ROLES = [
    "viewer",
    "contributor",
    "moderator",
    "contributor_moderator",
    "admin",
  ];
  const isCurrentUserItem = aclUsername === userUsername;
  let html = "";
  if (withPrompt) {
    html += '<option selected value="">-- Choose role --</option>';
  }
  for (const role of ACL_ROLES) {
    const roleText = role.replace("_", " + ");
    const isCurrentUserRole = role === aclRole;
    const optionEl = new Option(roleText, role, isCurrentUserRole);
    optionEl.disabled = isCurrentUserItem && !isCurrentUserRole;
    html += optionEl.outerHTML;
  }
  return `<select class="roles" required>${html}</select>`;
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function disableControls(disabled) {
  const controls = dialog.querySelectorAll("button, input, select");
  controls.forEach((el) => (el.disabled = disabled));
}

function showSubmitting(enable) {
  disableControls(enable);
  buttonSubmit.classList.toggle("spinner", enable);
}

function enableShowDialogButtons() {
  const buttons = document.querySelectorAll(SHOW_DIALOG_SELECTOR);
  buttons.forEach((btn) => (btn.disabled = false));
}
