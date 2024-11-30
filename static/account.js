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
    const oldText = button.innerText;
    const newText = prompt("Rename passkey", oldText);

    if (!newText) {
      return;
    }

    button.textContent = newText;

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

    const { ok } = await fetch("/auth/passkey-rename", {
      method: "post",
      body: JSON.stringify({ newText, credId: button.dataset.credId }),
      signal: abortController.signal,
    });

    if (!ok) {
      button.textContent = oldText;
    }

    spinner.remove();
  });
});
