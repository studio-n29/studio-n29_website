/* FR / EN switch. French text is pre-rendered in the HTML (SEO, no flash);
   this script swaps in English (or French) from /i18n/*.json when needed. */
(() => {
  const root = document.documentElement;
  const base = root.dataset.root || "";
  const KEY = "n29-lang";
  const cache = {};

  const detect = () => {
    try { const s = localStorage.getItem(KEY); if (s === "fr" || s === "en") return s; } catch (e) { /* storage unavailable */ }
    return (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
  };

  const load = async (lang) => {
    if (!cache[lang]) {
      const res = await fetch(`${base}i18n/${lang}.json`);
      cache[lang] = await res.json();
    }
    return cache[lang];
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

  const set = async (lang, persist = true) => {
    try {
      apply(await load(lang), lang);
      if (persist) { try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ } }
      document.dispatchEvent(new CustomEvent("n29:lang", { detail: lang }));
    } catch (err) {
      console.error("i18n: could not load language", lang, err);
    }
  };

  window.N29 = window.N29 || {};
  window.N29.t = (key) => (cache[root.lang] || {})[key] || "";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => set(b.dataset.lang)));
    const lang = detect();
    if (lang !== "fr") set(lang, false);
    else load("fr"); // warm the cache for form messages
  });
})();
