const rootEl = document.getElementById("settings-form");
const newBudgetBtn = document.getElementById("add-budget");
const newBudgetTemplate = document.getElementById("blankBudget");

rootEl.onclick = ({ target }) => {
  if (target.matches("button.remove")) {
    const budget = target.closest(".budget-fieldset");
    const isNew = budget.classList.contains("new-budget");
    if (isNew) newBudgetBtn.hidden = false;
    budget.remove();
  }
};

newBudgetBtn.onclick = () => {
  const clone = newBudgetTemplate.content.cloneNode(true);
  newBudgetBtn.before(clone);
  newBudgetBtn.hidden = true;
};
