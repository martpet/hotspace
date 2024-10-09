// =====================
// Create New Space
// =====================
{
  const buttonOpen = document.getElementById("open-create-space");
  const buttonCancel = document.getElementById("cancel-create-space");
  const buttonSubmit = document.getElementById("submit-create-space");
  const dialog = document.getElementById("create-space");
  const form = dialog?.querySelector("form");
  const nameField = dialog?.querySelector("[name=name]");
  const descriptionField = dialog?.querySelector("[name=description]");

  if (buttonOpen) {
    buttonOpen.disabled = false;
  }

  dialog && window.addEventListener("pageshow", () => {
    dialog.close();
    form.reset();
  });

  buttonOpen?.addEventListener("click", () => {
    dialog.showModal();
  });

  buttonCancel?.addEventListener("click", () => {
    dialog.close();
  });

  form?.addEventListener("reset", () => {
    setError("");
    setInProgress(false);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  function setInProgress(inProgress) {
    disableControls(inProgress);
    buttonSubmit.classList.toggle("spin", inProgress);
  }

  function disableControls(disable) {
    const buttons = [buttonSubmit, buttonCancel];
    const fields = [nameField, descriptionField];
    buttons.forEach((el) => el.disabled = disable);
    fields.forEach((el) => el.style.pointerEvents = disable ? "none" : "auto");
  }

  function setError(msg) {
    if (msg) {
      setInProgress(false);
      form.insertAdjacentHTML(
        "beforebegin",
        `<p class="alert error">${msg}</p>`,
      );
    } else {
      dialog.querySelector(".alert.error")?.remove();
    }
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
      setError(APP.GENERAL_ERROR_MSG);
    }
  }
}

// =====================
// Delete Space
// =====================
{
  const buttonOpen = document.getElementById("open-delete-space");
  const buttonCancel = document.getElementById("cancel-delete-space");
  const dialog = document.getElementById("delete-space");
  const form = dialog?.querySelector("form");

  if (buttonOpen) {
    buttonOpen.disabled = false;
  }

  buttonOpen?.addEventListener("click", () => {
    dialog.showModal();
  });

  buttonCancel?.addEventListener("click", () => {
    dialog.close();
  });

  dialog && window.addEventListener("pageshow", () => {
    dialog.close();
  });

  dialog?.addEventListener("close", () => {
    form.reset();
  });
}
