const btnShowDialog = document.getElementById("show-create-dir");
const { isRoot } = btnShowDialog.dataset;

let dialog;
let form;
let inputField;
let previewEl;
let btnSubmit;
let btnClose;
let errorEl;

btnShowDialog.disabled = false;

// =====================
// Events
// =====================

btnShowDialog.addEventListener("click", () => {
  if (dialog) {
    dialog.showModal();
    return;
  }

  const dialogTitle = btnShowDialog.textContent.replace("…", "");
  const constraints = JSON.parse(btnShowDialog.dataset.constraints);

  btnShowDialog.insertAdjacentHTML(
    "afterend",
    `
      <dialog id="create-dir-dialog">
        <h1>${dialogTitle}</h1>
        <p role="alert" class="error" hidden></p>
        <form class="basic-form">
          <label>
            Name:
            <input type="text" name="dirName" required />
            <small ${!isRoot && "hidden"}>
              ${location.href}<output name="namePreview"></output>
            </small>
          </label>
          <footer>
            <button class="close" type="button">Cancel</button>
            <button class="submit">${dialogTitle}</button>
          </footer>
        </form>
      </dialog>
    `,
  );

  dialog = document.getElementById("create-dir-dialog");
  form = dialog.querySelector("form");
  inputField = form.elements.dirName;
  previewEl = form.elements.namePreview;
  btnSubmit = form.querySelector("button.submit");
  btnClose = form.querySelector("button.close");
  errorEl = dialog.querySelector("p.error");

  dialog.showModal();

  for (const entry of Object.entries(constraints)) {
    inputField.setAttribute(...entry);
  }

  btnClose.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    form.reset();
  });

  form.addEventListener("reset", () => {
    setError("");
    toggleProgress(false);
  });

  inputField.addEventListener("input", () => {
    previewEl.value = inputField.value;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    toggleProgress(true);
    setError("");
    const resp = await fetch("/inodes/dirs", {
      method: "post",
      body: JSON.stringify({ pathname: location.pathname + inputField.value }),
    });
    if (resp.ok) {
      location.reload();
    } else {
      toggleProgress(false);
      setError(await resp.text() || GENERAL_ERR_MSG);
      inputField.focus();
    }
  });
});

// =====================
// Rendering
// =====================

function toggleProgress(inProgress) {
  disableControls(inProgress);
  btnSubmit.classList.toggle("spinner", inProgress);
}

function disableControls(disable) {
  btnSubmit.disabled = disable;
  btnClose.disabled = disable;
  inputField.style.pointerEvents = disable ? "none" : "auto";
}

function setError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}
