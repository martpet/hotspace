const container = document.getElementById("inodes-container");
const batchMenu = document.getElementById("batch-operations-buttons");

container.addEventListener("change", ({ target }) => {
  const inputs = getInputs();
  const toggleAllEl = container.querySelector("thead input");
  if (target === toggleAllEl) {
    inputs.forEach((input) => input.checked = target.checked);
  } else {
    toggleAllEl.checked = inputs.every((input) => input.checked);
  }
  batchMenu.hidden = inputs.every((input) => !input.checked);
});

function getInputs() {
  return [...container.querySelectorAll("tbody input").values()];
}
