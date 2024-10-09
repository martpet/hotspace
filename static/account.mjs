// =====================
// Delete Passkey
// =====================

document.querySelectorAll(".delete-passkey").forEach((form) => {
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

document.querySelectorAll(".rename-passkey").forEach((button) => {
  const spinnerTemplate = document.querySelector(".spinner-template");
  let controller;
  let spinner;
  button.addEventListener("click", async () => {
    const initialName = button.innerText;
    const newName = prompt("Rename passkey", initialName);
    if (!newName) return;
    if (!spinner) {
      button.after(spinnerTemplate.content.cloneNode(true));
      spinner = button.nextSibling;
    }
    spinner.hidden = false;
    button.textContent = newName;
    if (controller) controller.abort();
    controller = new AbortController();
    const resp = await fetch("/auth/passkey-rename", {
      method: "post",
      body: JSON.stringify({ newName, credId: button.dataset.credId }),
      signal: controller.signal,
    });
    spinner.hidden = true;
    if (!resp.ok) button.textContent = initialName;
  });
});
