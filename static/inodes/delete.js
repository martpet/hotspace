const button = document.getElementById("delete-button");
let dialog;
let form;
let closeButton;

button.disabled = false;

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

function insertDialog() {
  const title = button.textContent;
  const { inodeName } = button.dataset;
  const kewordConfirm = "permanently delete";
  button.insertAdjacentHTML(
    "afterend",
    `
        <dialog id="delete-inode-dialog" >
          <h1>${title}</h1>
          <form action="/inodes/delete" method="post" class="basic-form">
            <input type="hidden" name="pathname" value="${location.pathname}" />
            <p class="alert warning">
              "${inodeName}" and all chat messages will be deleted.
              <br>This action cannot be undone.
            </p>
            <label>
              <span>To confirm, type <em>${kewordConfirm}</em></span>
              <input type="text" autofocus required pattern="${kewordConfirm}" />
            </label>
            <footer>
              <button type="button" id="close-dialog">Cancel</button>
              <button>Delete Forever</button>
            </footer>
          </form>
        </dialog>
      `,
  );
  dialog = document.getElementById("delete-inode-dialog");
  form = dialog.querySelector("form");
  closeButton = document.getElementById("close-dialog");
}
