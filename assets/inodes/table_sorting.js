import { createSignal } from "$main";

const DEFAULT_SORT_ORDER = "descending";
const container = document.getElementById("inodes-container");
const inner = document.getElementById("inodes");
const initialSortCol = inner.dataset.sortCol;
const initialSortOrder = inner.dataset.sortOrder;

// =====================
// Events
// =====================

container.onclick = ({ target }) => {
  if (target.dataset.sort) {
    sortingSignal.value = { col: target.dataset.sort };
  }
};

// =====================
// Signals
// =====================

const sortingSignal = createSignal({ col: initialSortCol });

sortingSignal.subscribe(({ col }, prev) => {
  const initialHistory = { [initialSortCol]: initialSortOrder };
  const storedHistory = localStorage.getItem("sort");
  const history = storedHistory ? JSON.parse(storedHistory) : initialHistory;
  const prevOrder = history[col] || DEFAULT_SORT_ORDER;
  let order = prevOrder;
  if (col === prev.col) {
    order = prevOrder === "ascending" ? "descending" : "ascending";
  }
  renderSorting({ col, order });
  const sortEntry = { [col]: order };
  const cookieVal = encodeURIComponent(JSON.stringify(sortEntry));
  document.cookie = `sort=${cookieVal};path=/;max-age=31536000;`;
  localStorage.setItem("sort", JSON.stringify({ ...history, ...sortEntry }));
});

// =====================
// Rendering
// =====================

function renderSorting(sorting) {
  const { col } = sorting;
  const order = sorting.order === "descending" ? -1 : 1;
  const table = container.querySelector("table");
  const tbody = table.tBodies[0];
  const button = table.tHead.querySelector(`[data-sort="${col}"]`);
  const prevCol = table.tHead.querySelector(`[aria-sort]`);
  const newCol = button.parentElement;

  if (prevCol !== newCol) prevCol.removeAttribute("aria-sort");
  newCol.setAttribute("aria-sort", sorting.order);

  const selectors = {
    name: (el) => el.querySelector(`.name`).textContent,
    kind: (el) => el.querySelector(`.kind`).textContent,
    access: (el) => el.querySelector(`.access`).textContent,
    date: (el) => el.querySelector(".date time").dateTime,
    size: (el) => Number(el.querySelector(".size").dataset.bytes || 0),
  };

  const sortedElements = Array.from(tbody.rows).sort((elA, elB) => {
    const a = selectors[col](elA);
    const b = selectors[col](elB);
    const aIsDir = elA.dataset.type === "dir";
    const bIsDir = elB.dataset.type === "dir";

    if (col === "kind" && aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }

    let primary = 0;
    if (typeof a === "string") {
      primary = order * a.localeCompare(b);
    } else {
      primary = order * (a > b ? 1 : a < b ? -1 : 0);
    }

    if (primary !== 0) return primary;

    const nameA = selectors.name(elA);
    const nameB = selectors.name(elB);
    return nameA.localeCompare(nameB);
  });

  tbody.replaceChildren(...sortedElements);
}
