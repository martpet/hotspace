import { GENERAL_ERR_MSG } from "$main";

// =====================
// Create Dir
// =====================

const btnOpenCreateDirDialog = document.getElementById(
  "open-create-dir-dialog",
);

if (btnOpenCreateDirDialog) {
  btnOpenCreateDirDialog.disabled = false;
  const { isRootDir } = btnOpenCreateDirDialog.dataset;
  const dialogTitle = isRootDir ? "Create Space" : "Create Folder";
  const submitBtnLabel = dialogTitle;
  const template = document.getElementById("create-dir-template");
  const tmplDirNameField = template.content.querySelector("input[name=dirName");

  let docPath = location.pathname;
  if (!docPath.endsWith("/")) docPath += "/";

  btnOpenCreateDirDialog.insertAdjacentHTML(
    "afterend",
    `
     <dialog id="create-dir-dialog">
        <h2>${dialogTitle}</h2>
        <p role="alert" class="error"></p>
        <form class="basic-form">
          <label>
            Name:
            ${tmplDirNameField.outerHTML}
            <em>${location.hostname}${docPath}<output name="dirNamePreview"></output></em>
          </label>
          <footer>
            <button type="reset">Cancel</button>
            <button type="submit">${submitBtnLabel}</button>
          </footer>
        </form>
      </dialog>
    `,
  );

  const dialog = document.getElementById("create-dir-dialog");
  const errorEl = dialog.querySelector("p.error");
  const form = dialog.querySelector("form");
  const dirNameField = form.elements.dirName;
  const dirNamePreview = form.elements.dirNamePreview;
  const btnSubmit = dialog.querySelector("button[type=submit]");
  const btnReset = document.querySelector("button[type=reset");

  btnOpenCreateDirDialog.addEventListener("click", () => {
    dialog.showModal();
  });

  btnReset.addEventListener("click", () => {
    dialog.close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  dialog.addEventListener("close", () => {
    form.reset();
  });

  form.addEventListener("reset", () => {
    setErrorMsg("");
    setInProgress(false);
    alert;
  });

  dirNameField.addEventListener("input", () => {
    dirNamePreview.value = dirNameField.value;
  });

  addEventListener("pageshow", () => {
    dialog.close();
  });

  async function handleSubmit() {
    setInProgress(true);
    const data = {
      pathname: docPath + dirNameField.value,
    };
    const resp = await fetch("/inodes/dirs", {
      method: "post",
      body: JSON.stringify(data),
    });
    if (resp.ok) {
      location.reload();
    } else {
      const errMsg = await resp.text();
      setErrorMsg(errMsg || GENERAL_ERR_MSG);
      setInProgress(false);
      dirNameField.focus();
    }
  }

  function setInProgress(inProgress) {
    disableControls(inProgress);
    btnSubmit.classList.toggle("spinner", inProgress);
    if (inProgress) setErrorMsg("");
  }

  function disableControls(disable) {
    const buttons = [btnSubmit, btnReset];
    const fields = [dirNameField];
    buttons.forEach((el) => el.disabled = disable);
    fields.forEach((el) => el.style.pointerEvents = disable ? "none" : "auto");
  }

  function setErrorMsg(msg) {
    errorEl.textContent = msg;
    if (msg) setInProgress(false);
  }
}
