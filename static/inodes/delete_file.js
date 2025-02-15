const button = document.getElementById("delete-button");

let dialog;
let form;
let buttonClose;

button.disabled = false;

// =====================
// Events
// =====================

button.onclick = () => {
  if (!dialog) {
    insertDialog();
    initDialogEvents();
  }
  dialog.showModal();
};

function initDialogEvents() {
  buttonClose.onclick = () => {
    dialog.close();
  };

  dialog.onclose = () => {
    form.reset();
  };
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
        <dialog id="delete-inode-dialog">
          <h1>Delete File</h1>
          <form action="/inodes/delete" method="post" class="basic-form">
            <input type="hidden" name="pathname" value="${location.pathname}" />
            <p class="alert warning">
              <strong>${fileName}</strong> and its chat messages will be deleted.<br />
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
  buttonClose = document.getElementById("delete-inode-close");
  form = dialog.querySelector("form");
}
