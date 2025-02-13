const PATTERN_CONFIRM = "permanently delete";
const dirPage = document.getElementById("dir-page");

// =====================
// Dir page
// =====================

if (dirPage) {
  let dialog;
  let dialogSummary;
  let dialogList;
  let dialogForm;
  let closeButton;
  let toggler;
  let checkboxes;
  let selection;

  const container = document.getElementById("inodes-container");
  const buttonDelete = document.getElementById("batch-delete-button");
  const batchMenu = document.getElementById("batch-operations-buttons");
  const observer = new MutationObserver(onMutationObserve);

  observer.observe(container, {
    subtree: true,
    childList: true,
  });

  getContainerElements();

  /* ---- Events ---- */

  container.onchange = ({ target }) => {
    if (target.matches("[type=checkbox]")) {
      handleSelection(target);
    }
  };

  buttonDelete.onclick = () => {
    if (!dialog) {
      insertDialog();
      initDialogEvents();
    }
    updateDialogContent();
    dialog.showModal();
  };

  function initDialogEvents() {
    closeButton.onclick = () => {
      dialog.close();
    };

    dialog.onclose = () => {
      dialogForm.reset();
    };

    dialogForm.onsubmit = (event) => {
      event.preventDefault();
    };
  }

  function onMutationObserve() {
    getContainerElements();
  }

  /* ---- Rendering ---- */

  function insertDialog() {
    buttonDelete.insertAdjacentHTML(
      "afterend",
      `
        <dialog id="batch-delete-dialog">
          <h1>Delete Items</h1>
          <form action="/inodes/delete" class="basic-form">
            <p class="alert warning">
              <span id="batch-delete-summary"></span> will be deleted.<br />
              This action cannot be undone.
            </p>
            <ul id="batch-delete-list">
            </ul>
            <label>
              <span>To confirm, type <em>${PATTERN_CONFIRM}</em> in the box:</span>
              <input type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="batch-delete-close">Cancel</button>
              <button>Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `,
    );
    dialog = document.getElementById("batch-delete-dialog");
    dialogSummary = document.getElementById("batch-delete-summary");
    dialogList = document.getElementById("batch-delete-list");
    dialogForm = dialog.querySelector("form");
    closeButton = document.getElementById("batch-delete-close");
  }

  /* ---- Helpers ---- */

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
    toggler.disabled = false;
    checkboxes.forEach((chbox) => chbox.disabled = false);
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

  function updateDialogContent() {
    let numDirs = 0;
    let numFiles = 0;
    let listItems = [];
    let summary = "";
    for (const { isDir, name, pathname } of selection) {
      isDir ? numFiles++ : numDirs++;
      const inodeType = isDir ? "dir" : "file";
      listItems.push(
        `<li><a href="${pathname}" target="_blank" class="inode ${inodeType}">${name}</a></li>`,
      );
    }
    if (numDirs) summary += `${numDirs} file${numDirs > 1 ? "s" : ""}`;
    if (numDirs && numFiles) summary += ", ";
    if (numFiles) summary += `${numFiles} folder${numFiles > 1 ? "s" : ""}`;
    if (numDirs && numFiles) summary += ", ";
    summary += ` and ${selection.length > 1 ? "their" : "its"} chat messages`;
    dialogSummary.textContent = summary;
    dialogList.innerHTML = listItems.join("");
  }
}

// =====================
// File page
// =====================

if (!dirPage) {
  const button = document.getElementById("delete-button");
  let dialog;
  let form;
  let closeButton;

  button.disabled = false;

  /* ---- Events ---- */

  button.onclick = () => {
    if (!dialog) {
      insertDialog();
      initDialogEvents();
    }
    dialog.showModal();
  };

  function initDialogEvents() {
    closeButton.onclick = () => {
      dialog.close();
    };

    dialog.onclose = () => {
      form.reset();
    };
  }

  /* ---- Rendering ---- */

  function insertDialog() {
    const { inodeName } = button.dataset;
    button.insertAdjacentHTML(
      "afterend",
      `
        <dialog id="delete-inode-dialog">
          <h1>${button.textContent}</h1>
          <form action="/inodes/delete" method="post" class="basic-form">
            <input type="hidden" name="pathname" value="${location.pathname}" />
            <p class="alert warning">
              '<strong>${inodeName}</strong>' and all chat messages will be deleted.<br />
              This action cannot be undone.
            </p>
            <label>
              <span>To confirm, type <em>${PATTERN_CONFIRM}</em> in the box:</span>
              <input type="text" autofocus required pattern="${PATTERN_CONFIRM}" />
            </label>
            <footer>
              <button type="button" id="delete-inode-close">Cancel</button>
              <button>Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `,
    );
    dialog = document.getElementById("delete-inode-dialog");
    closeButton = document.getElementById("delete-inode-close");
    form = dialog.querySelector("form");
  }
}
