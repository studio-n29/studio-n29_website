/* FR / EN switch. French text is pre-rendered in the HTML (SEO, no flash);
   dictionaries are embedded in js/i18n-data.js (generated), so no fetch is needed
   and the switch also works when the page is opened from disk (file://). */
(() => {
  const root = document.documentElement;
  const KEY = "n29-lang";
  const dicts = window.N29_I18N || {};

  const detect = () => {
    try { const s = localStorage.getItem(KEY); if (s === "fr" || s === "en") return s; } catch (e) { /* storage unavailable */ }
    return "en"; // default language
  };

  const apply = (dict, lang) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const v = dict[el.dataset.i18nHtml];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });
    const name = root.dataset.project;
    const title = name ? (dict["meta.title.project"] || "").replace("{name}", root.dataset.projectName) : dict["meta.title"];
    if (title) document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    const descKey = name ? "p." + name + ".tagline" : "meta.description";
    if (desc && dict[descKey]) desc.content = dict[descKey];
    root.lang = lang;
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  };

  const set = (lang, persist = true) => {
    try {
      apply(dicts[lang], lang);
      if (persist) { try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ } }
      document.dispatchEvent(new CustomEvent("n29:lang", { detail: lang }));
    } catch (err) {
      console.error("i18n: could not load language", lang, err);
    }
  };

  window.N29 = window.N29 || {};
  window.N29.t = (key) => (dicts[root.lang] || {})[key] || "";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => set(b.dataset.lang)));
    const lang = detect();
    if (lang !== "en") set(lang, false);
  });
})();
