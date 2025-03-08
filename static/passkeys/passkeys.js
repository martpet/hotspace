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
  button.addEventListener("click", async () => {
    const oldName = button.innerText;
    const newName = prompt("Rename passkey", oldName);
    if (!newName) return;

    button.textContent = newName;
    button.classList.add("spinner");

    if (abortController) abortController.abort();

    abortController = new AbortController();

    const resp = await fetch("/auth/passkey-rename", {
      method: "post",
      body: JSON.stringify({ newName, credId: button.dataset.credId }),
      signal: abortController.signal,
    });

    if (!resp.ok) button.textContent = oldName;
    button.classList.remove("spinner");
  });
});
