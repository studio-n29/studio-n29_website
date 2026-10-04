/* Image lightbox: click a preview to see the whole image. Keys: Esc, ←, →. Swipe on touch. */
document.addEventListener("DOMContentLoaded", () => {
  const shots = [...document.querySelectorAll(".gallery .shot")];
  if (!shots.length) return;
  const t = (k) => (window.N29 && window.N29.t(k)) || "";

  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.hidden = true;
  box.innerHTML = `
    <button type="button" class="lb-btn lb-close" data-i18n-attr="aria-label:lb.close" aria-label="Close">✕</button>
    <button type="button" class="lb-btn lb-prev" data-i18n-attr="aria-label:lb.prev" aria-label="Previous">←</button>
    <figure class="lb-stage"><img alt=""><figcaption class="lb-count mono"></figcaption></figure>
    <button type="button" class="lb-btn lb-next" data-i18n-attr="aria-label:lb.next" aria-label="Next">→</button>`;
  document.body.appendChild(box);

  const img = box.querySelector("img");
  const count = box.querySelector(".lb-count");
  const btnClose = box.querySelector(".lb-close");
  let index = 0;
  let opener = null;

  const labels = () => {
    btnClose.setAttribute("aria-label", t("lb.close") || "Close");
    box.querySelector(".lb-prev").setAttribute("aria-label", t("lb.prev") || "Previous");
    box.querySelector(".lb-next").setAttribute("aria-label", t("lb.next") || "Next");
  };
  document.addEventListener("n29:lang", labels);

  const show = (i) => {
    index = (i + shots.length) % shots.length;
    const src = shots[index].querySelector("img");
    img.classList.remove("is-in");
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    count.textContent = `${index + 1} / ${shots.length}`;
    requestAnimationFrame(() => img.classList.add("is-in"));
    // warm the neighbours
    [index + 1, index - 1].forEach((n) => { const s = shots[(n + shots.length) % shots.length].querySelector("img"); new Image().src = s.currentSrc || s.src; });
  };

  const open = (i, from) => {
    opener = from;
    box.hidden = false;
    document.documentElement.classList.add("lb-open");
    labels();
    show(i);
    btnClose.focus();
  };
  const close = () => {
    box.hidden = true;
    document.documentElement.classList.remove("lb-open");
    img.removeAttribute("src");
    if (opener) opener.focus();
  };

  shots.forEach((b, i) => b.addEventListener("click", () => open(i, b)));
  btnClose.addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => show(index - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (e) => { if (e.target === box || e.target.classList.contains("lb-stage")) close(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "Tab") { // keep focus inside the dialog
      const f = [...box.querySelectorAll("button")];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  let x0 = null;
  box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
});
