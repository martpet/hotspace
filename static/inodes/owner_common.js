import { replaceFragment } from "$main";

// =====================
// Delete Inode
// =====================
{
  const button = document.getElementById("delete-inode");
  let dialog;
  let form;
  let closeButton;

  if (button) {
    button.disabled = false;
    button.onclick = () => {
      showDeleteDialog();
    };
  }

  function showDeleteDialog() {
    if (!dialog) {
      insertDialog();
      initDialogEvents();
    }
    dialog.showModal();
  }

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
        <dialog id="delete-inode-dialog" autofocus>
          <h1>${title}</h1>
          <form action="/inodes/delete" method="post" class="basic-form">
            <input type="hidden" name="pathname" value="${location.pathname}" />
            <p class="alert warning">
              "${inodeName}" and all chat messages will be deleted.
              <br>This action cannot be undone.
            </p>
            <label>
              <span>To confirm, type <em>${kewordConfirm}</em></span>
              <input type="text" required pattern="${kewordConfirm}" />
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
}

// =====================
// Toggle Chat
// =====================
{
  const button = document.getElementById("toggle-chat");
  button.disabled = false;
  button.classList.remove("wait-disabled");
  button.onclick = toggle;

  async function toggle() {
    setInProgress(true);
    if (!(await callDb()).ok) return;
    const rootEl = document.getElementById("chat");
    const isHidden = !rootEl.hidden;
    const isHtmlInserted = rootEl.hasChildNodes();
    if (isHtmlInserted) {
      rootEl.hidden = isHidden;
    } else {
      await insertChatHtml();
    }
    setInProgress(false);
    button.textContent = `${isHidden ? "Enable" : "Disable"} Chat`;
  }

  function setInProgress(inProgress) {
    button.disabled = inProgress;
    button.classList.toggle("spinner", inProgress);
  }

  function callDb() {
    const { pathname } = location;
    return fetch("/chat/toggle", {
      method: "post",
      body: JSON.stringify({ pathname }),
    });
  }

  async function insertChatHtml() {
    await replaceFragment("chat");
    const script = document.getElementById("chat-script");
    const newScript = document.createElement("script");
    newScript.src = script.src;
    newScript.type = script.type;
    script.replaceWith(newScript);
  }
}
