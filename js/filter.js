/* Games page: filter the project cards by category. Without JS every card stays visible. */
document.addEventListener("DOMContentLoaded", () => {
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("#grid .card")];
  if (!buttons.length) return;
  const apply = (f) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
    cards.forEach((c) => { c.hidden = f !== "all" && c.dataset.cat !== f; });
  };
  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
});
