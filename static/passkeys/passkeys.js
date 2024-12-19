// =====================
// Delete Passkey
// =====================

document.querySelectorAll("button.delete-passkey").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (confirm("Delete passkey?")) {
      form.submit();
    }
  });
});

// =====================
// Rename Passkey
// =====================

document.querySelectorAll("button.rename-passkey").forEach((button) => {
  let abortController;
  let spinner;
  button.addEventListener("click", async () => {
    const oldName = button.innerText;
    const newName = prompt("Rename passkey", oldName);

    if (!newName) {
      return;
    }

    button.textContent = newName;

    if (!spinner) {
      spinner = document.createElement("span");
      spinner.classList.add("spinner");
      spinner.role = "progressbar";
      button.insertAdjacentElement("afterend", spinner);
    }

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();

    const { ok } = await fetch("/account/passkeys/rename", {
      method: "post",
      body: JSON.stringify({ newName, credId: button.dataset.credId }),
      signal: abortController.signal,
    });

    if (!ok) {
      button.textContent = oldName;
    }

    spinner.remove();
  });
});
