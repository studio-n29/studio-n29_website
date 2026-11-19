/* Tab / viewer widgets ([data-tabs]). Without JS every panel is simply shown one after the other.
   An optional [data-zone-filter] button group filters the tabs (agent viewer: New York, Paris, Moscow, Salem). */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-tabs]").forEach((box) => {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    if (!tabs.length) return;
    const visible = () => tabs.filter((t) => !t.hidden);
    const select = (i, focus = false) => {
      tabs.forEach((t, j) => {
        t.setAttribute("aria-selected", String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        if (panels[j]) panels[j].hidden = i !== j;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const v = visible();
        const k = v.indexOf(t);
        const go = (n) => { e.preventDefault(); select(tabs.indexOf(v[(n + v.length) % v.length]), true); };
        if (e.key === "ArrowRight" || e.key === "ArrowDown") go(k + 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(k - 1);
        else if (e.key === "Home") go(0);
        else if (e.key === "End") go(v.length - 1);
      });
    });

    const filters = [...box.querySelectorAll("[data-zone-filter]")];
    filters.forEach((f) => f.addEventListener("click", () => {
      const zone = f.dataset.zoneFilter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === f)));
      tabs.forEach((t) => { t.hidden = zone !== "all" && t.dataset.zone !== zone; });
      const first = tabs.findIndex((t) => !t.hidden);
      if (first >= 0) select(first);
    }));
    select(0);
  });
});
