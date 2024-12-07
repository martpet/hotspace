import { GENERAL_ERR_MSG } from "$main";

// =====================
// Create space
// =====================

const btnOpenCreateDialog = document.getElementById("open-create-space-dialog");

if (btnOpenCreateDialog) {
  const template = document.getElementById("create-space-template");
  const nameInput = template.content.querySelector("input");
  const textarea = template.content.querySelector("textarea");

  btnOpenCreateDialog.insertAdjacentHTML(
    "afterend",
    `
     <dialog id="create-space-dialog">
        <h2>Create New Space</h2>
        <form method="post" action="/spaces" class="basic-form">
          <p role="alert" class="error"></p>
          <label>Name: ${nameInput.outerHTML}</label>
          <label>
            <span>Description: <small>(optional)</small></span>
            ${textarea.outerHTML}
          </label>
          <footer>
            <button type="reset" id="cancel-create-space">Cancel</button>
            <button id="submit-create-space">Create Space</button>
          </footer>
        </form>
      </dialog>
    `,
  );

  const dialog = document.getElementById("create-space-dialog");
  const form = dialog.querySelector("form");
  const nameField = dialog.querySelector("[name=name]");
  const descriptionField = dialog.querySelector("[name=description]");
  const btnSubmit = document.getElementById("submit-create-space");
  const btnCancel = document.getElementById("cancel-create-space");
  const errorEl = form.querySelector("p.error");

  btnOpenCreateDialog.disabled = false;

  btnOpenCreateDialog.addEventListener("click", () => {
    dialog.showModal();
  });

  btnCancel.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    form.reset();
  });

  form.addEventListener("reset", () => {
    setError("");
    setInProgress(false);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  addEventListener("pageshow", () => {
    dialog.close();
  });

  function setInProgress(inProgress) {
    disableControls(inProgress);
    btnSubmit.classList.toggle("spinner", inProgress);
  }

  function disableControls(disable) {
    const buttons = [btnSubmit, btnCancel];
    const fields = [nameField, descriptionField];
    buttons.forEach((el) => el.disabled = disable);
    fields.forEach((el) => el.style.pointerEvents = disable ? "none" : "auto");
  }

  function setError(msg) {
    errorEl.textContent = msg;
    if (msg) setInProgress(false);
  }

  async function checkNameAvailable(name) {
    const resp = await fetch("/spaces/check-name-available", {
      method: "post",
      body: name,
    });
    if (!resp.ok) throw new Error();
    return resp.json();
  }

  async function handleSubmit() {
    setInProgress(true);
    setError("");
    const spaceName = nameField.value;
    try {
      const { isAvailable, reason } = await checkNameAvailable(spaceName);
      if (isAvailable) {
        form.submit();
      } else {
        setError(reason);
      }
    } catch (err) {
      setError(GENERAL_ERR_MSG);
    }
  }
}

// =====================
// Delete space
// =====================

const btnOpenDelDialog = document.getElementById("open-del-space-dialog");

if (btnOpenDelDialog) {
  const spaceName = btnOpenDelDialog.dataset.spaceName;
  btnOpenDelDialog.insertAdjacentHTML(
    "afterend",
    `
    <dialog id="delete-space-dialog">
      <h2>Delete Space '${spaceName}'</h2>
      <form method="post" action="/spaces/delete" class="basic-form">
        <p class="alert warning">
          Are you sure you want to delete space <strong>${spaceName}</strong>?
          <br />This action cannot be undone.
        </p>
        <input type="hidden" name="spaceName" value="${spaceName}" />
        <label>
          Enter space name:
          <input type="text" required pattern="${spaceName}" />
        </label>
        <footer>
          <button form="close-space-dialog">Cancel</button>
          <button>Delete Space Forever</button>
        </footer>
      </form>
      <form method="dialog" id="close-space-dialog" />
    </dialog>
  `,
  );

  const dialog = document.getElementById("delete-space-dialog");
  const form = dialog.querySelector("form");

  btnOpenDelDialog.disabled = false;

  btnOpenDelDialog.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    form.reset();
  });

  window.addEventListener("pageshow", () => {
    dialog.close();
  });
}
