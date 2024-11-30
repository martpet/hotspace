import { GENERAL_ERR_MSG } from "$main";

// =====================
// Create space
// =====================

const dialogCreate = document.getElementById("create-space");

if (dialogCreate) {
  const dialog = dialogCreate;
  const form = dialog.querySelector("form");
  const nameField = dialog.querySelector("[name=name]");
  const descriptionField = dialog.querySelector("[name=description]");
  const btnOpen = document.getElementById("open-create-space");
  const btnSubmit = document.getElementById("submit-create-space");
  const btnCancel = document.getElementById("cancel-create-space");
  const errorEl = form.querySelector("p.error");

  btnOpen.disabled = false;

  btnOpen.addEventListener("click", () => {
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

const dialogDelete = document.getElementById("delete-space");

if (dialogDelete) {
  const dialog = dialogDelete;
  const form = dialog.querySelector("form");
  const btnOpen = document.getElementById("open-delete-space");

  btnOpen.disabled = false;

  btnOpen.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    form.reset();
  });

  window.addEventListener("pageshow", () => {
    dialog.close();
  });
}
