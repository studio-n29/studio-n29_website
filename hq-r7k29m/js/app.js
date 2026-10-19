/* N29 HQ — app shell: lock screen, router, navigation, auto-lock. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, store = HQ.store;
  HQ.views = HQ.views || {};
  const app = document.getElementById("app");

  const NAV = [
    { id: "dash", path: "/", label: "Accueil", icon: "home", tab: true },
    { id: "projects", path: "/projects", label: "Projets", icon: "tasks", tab: true },
    { id: "time", path: "/time", label: "Temps", icon: "clock", tab: true },
    { id: "docs", path: "/docs", label: "Facturation", icon: "doc", tab: true },
    { id: "clients", path: "/clients", label: "Clients", icon: "users" },
    { id: "tools", path: "/tools", label: "Outils", icon: "tools" },
    { id: "compliance", path: "/compliance", label: "Conformité", icon: "shield" },
    { id: "settings", path: "/settings", label: "Réglages", icon: "settings" },
  ];
  const ROUTES = [
    [/^\/$/, "dash", "dash"], [/^\/projects$/, "projects", "projects"], [/^\/projects\/doc\/([\w-]+)$/, "noteEdit", "projects", ["id"]], [/^\/time$/, "time", "time"],
    [/^\/docs$/, "docs", "docs"], [/^\/docs\/new\/(quote|invoice|deposit|credit)$/, "docEdit", "docs", ["type"]], [/^\/docs\/([\w-]+)$/, "docEdit", "docs", ["id"]],
    [/^\/clients$/, "clients", "clients"], [/^\/tools$/, "tools", "tools"], [/^\/tools\/apex$/, "apex", "tools"],
    [/^\/compliance$/, "compliance", "compliance"], [/^\/settings$/, "settings", "settings"], [/^\/more$/, "more", "more"],
  ];

  let mainEl = null, cleanup = null, lastActivity = Date.now(), idleTimer = null;

  // ---------- Routing ----------
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    return { path: path || "/", query: Object.fromEntries(new URLSearchParams(qs || "")) };
  }
  HQ.refresh = () => route();
  HQ.go = (path) => { if (location.hash === "#" + path) route(); else location.hash = path; };
  function route() {
    if (!store.isUnlocked() || !mainEl) return;
    const { path, query } = parseHash();
    let hit = null;
    for (const [re, view, nav, names] of ROUTES) {
      const m = re.exec(path);
      if (m) { const params = {}; (names || []).forEach((n, i) => (params[n] = m[i + 1])); hit = { view, nav, params }; break; }
    }
    if (!hit) hit = { view: "dash", nav: "dash", params: {} };
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    U.clear(mainEl);
    try {
      const ctx = { params: hit.params, query, rerender: route, go: HQ.go };
      cleanup = (HQ.views[hit.view] || HQ.views.dash)(mainEl, ctx) || null;
    } catch (e) {
      console.error(e);
      mainEl.appendChild(h("div.empty", "Une erreur est survenue en affichant cette page : " + e.message));
    }
    document.querySelectorAll("[data-nav]").forEach((a) => (a.dataset.nav === hit.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    window.scrollTo(0, 0);
  }

  // ---------- Shell ----------
  function backupLabel() {
    const t = store.db().lastBackupAt;
    if (!t) return { text: "Aucune sauvegarde", warn: true };
    const days = Math.floor((Date.now() - t) / 86400000);
    return { text: days === 0 ? "Sauvegardé aujourd'hui" : `Sauvegarde il y a ${days} j`, warn: days > 14 };
  }
  function renderShell() {
    const b = backupLabel();
    const link = (n, cls) => h("a", { href: "#" + n.path, dataset: { nav: n.id }, class: cls }, icon(n.icon), h("span", n.label));
    const side = h("aside.side", h("div.side-brand", { html: U.LOGO }, h("div", "STUDIO N29", h("small", "HQ · PRIVÉ"))),
      NAV.map((n) => link(n)), h("div.grow"),
      HQ.isStandalone() ? null : h("button.navb", { type: "button", dataset: { install: "1" }, onclick: HQ.install }, icon("download"), h("span", "Installer l'app")),
      h("button.navb", { type: "button", onclick: () => lockNow() }, icon("lock"), h("span", "Verrouiller")),
      HQ.sync ? h("div.backup", HQ.sync.chip()) : null,
      h("div.backup" + (b.warn ? ".warn" : ""), b.text));
    mainEl = h("main.main#view", { tabindex: "-1" });
    const tabs = h("nav.tabbar", { "aria-label": "Navigation" }, NAV.filter((n) => n.tab).map((n) => h("a.tab", { href: "#" + n.path, dataset: { nav: n.id } }, icon(n.icon), n.label)), h("a.tab", { href: "#/more", dataset: { nav: "more" } }, icon("more"), "Plus"));
    app.replaceChildren(h("div.shell", side, mainEl, tabs));
  }

  // ---------- Lock screen ----------
  function lockScreen(mode) {
    // mode: "create" | "unlock"
    document.documentElement.style.overflow = "";
    const err = h("p.err", { role: "alert" });
    const pass = U.input({ type: "password", autocomplete: mode === "create" ? "new-password" : "current-password", placeholder: "Phrase secrète", "aria-label": "Phrase secrète" });
    const pass2 = U.input({ type: "password", autocomplete: "new-password", placeholder: "Confirmer la phrase secrète", "aria-label": "Confirmer la phrase secrète" });
    const ack = h("input", { type: "checkbox", id: "ack" });
    const submit = h("button.btn.btn--accent.btn--block", { type: "submit" }, mode === "create" ? "Créer mon coffre" : "Déverrouiller");
    const restore = h("button.btn.btn--ghost.btn--sm", { type: "button", onclick: restoreFromFile }, icon("upload"), "Restaurer une sauvegarde");

    async function restoreFromFile() {
      const f = await U.pickFile(".json,application/json"); if (!f) return;
      const text = await U.readFile(f), type = store.peekBackupType(text);
      if (type === "n29hq-backup-encrypted") {
        const p = U.input({ type: "password", placeholder: "Phrase secrète de la sauvegarde" });
        const msg = h("p.ferr", { role: "alert" });
        const s = U.sheet({ title: "Restaurer la sauvegarde", body: h("form.form", { onsubmit: async (e) => { e.preventDefault(); try { await store.importBackup(text, p.value); s.close(true); start(); } catch (x) { msg.textContent = "Phrase secrète incorrecte ou fichier corrompu."; } } }, h("p.muted", "Cette sauvegarde est chiffrée : saisissez la phrase secrète utilisée lors de son export. Elle deviendra la phrase secrète de cet appareil."), U.field("Phrase secrète", p), msg, h("div.form-actions", U.btn("Restaurer", { kind: "accent", type: "submit" }))) });
      } else if (type === "n29hq-backup-plain") {
        err.textContent = "Cette sauvegarde est lisible (non chiffrée) : créez d'abord un coffre, puis importez-la depuis Réglages ▸ Données.";
      } else err.textContent = "Fichier de sauvegarde non reconnu.";
    }

    const form = h("form.lock-card", {
      onsubmit: async (e) => {
        e.preventDefault(); err.textContent = "";
        if (mode === "create") {
          if (pass.value.length < 10) { err.textContent = "10 caractères minimum (une phrase de plusieurs mots est idéale)."; return; }
          if (pass.value !== pass2.value) { err.textContent = "Les deux phrases ne correspondent pas."; return; }
          if (!ack.checked) { err.textContent = "Cochez la case pour confirmer."; return; }
        }
        submit.disabled = true; submit.textContent = mode === "create" ? "Création…" : "Déverrouillage…";
        try { if (mode === "create") await store.create(pass.value); else await store.unlock(pass.value); start(); }
        catch (x) { console.error(x); err.textContent = mode === "create" ? "Création impossible : " + x.message : "Phrase secrète incorrecte."; submit.disabled = false; submit.textContent = mode === "create" ? "Créer mon coffre" : "Déverrouiller"; pass.select(); }
      },
    },
      h("div.lock-logo", { html: U.LOGO }),
      h("div", h("div.eyebrow", "STUDIO N29 · HQ"), h("h1", { style: "margin-top:8px" }, mode === "create" ? "Créez votre coffre" : "Espace privé")),
      h("p", mode === "create" ? "Vos devis, factures, clients et projets sont stockés uniquement sur cet appareil, chiffrés par une phrase secrète. Aucun serveur, aucun compte." : "Saisissez votre phrase secrète pour déverrouiller."),
      pass, mode === "create" ? pass2 : null,
      mode === "create" ? h("div.notice", "Cette phrase ne peut pas être récupérée. Sans elle (et sans sauvegarde), les données sont perdues. Notez-la dans un gestionnaire de mots de passe.") : null,
      mode === "create" ? h("label.check", ack, "J'ai compris et je note ma phrase secrète.") : null,
      mode === "create" && HQ.platform() === "ios" && !HQ.isStandalone() ? h("div.notice", "iPhone : installez d'abord l'application (Partager ▸ Sur l'écran d'accueil), puis créez votre coffre dans l'application installée : elle a son propre stockage, séparé de Safari.") : null,
      err, submit, h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, restore, mode === "create" && HQ.sync && HQ.sync.configured() ? h("button.btn.btn--ghost.btn--sm", { type: "button", onclick: () => HQ.sync.restoreSheet(start) }, icon("refresh"), "Restaurer depuis le cloud") : null, HQ.installButton({ sm: true })));
    app.replaceChildren(h("div.lock", form));
    setTimeout(() => pass.focus(), 50);
  }

  async function lockNow() {
    try { if (HQ.sync) await Promise.race([HQ.sync.flush(), new Promise((r) => setTimeout(r, 4000))]); } catch (e) { /* offline: the local copy is safe */ }
    await store.lock(true);
    clearInterval(idleTimer); mainEl = null;
    lockScreen("unlock");
  }
  HQ.lockNow = lockNow;

  // ---------- Auto-lock ----------
  function armIdle() {
    clearInterval(idleTimer);
    lastActivity = Date.now();
    idleTimer = setInterval(() => {
      if (!store.isUnlocked()) return;
      const min = Number(store.db().settings.security.autoLockMinutes) || 0;
      if (min > 0 && Date.now() - lastActivity > min * 60000) lockNow();
    }, 10000);
  }
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && store.isUnlocked()) { const min = Number(store.db().settings.security.autoLockMinutes) || 0; if (min > 0 && Date.now() - lastActivity > min * 60000) lockNow(); } });

  // ---------- PWA install ("Installer l'application") ----------
  const ua = navigator.userAgent;
  HQ.isStandalone = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: minimal-ui)").matches || navigator.standalone === true;
  HQ.platform = () => (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : /android/i.test(ua) ? "android" : "desktop");
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); HQ.installPrompt = e; document.dispatchEvent(new Event("hq:installable")); });
  window.addEventListener("appinstalled", () => { HQ.installPrompt = null; U.toast("Application installée", "ok"); document.querySelectorAll("[data-install]").forEach((el) => el.remove()); });
  function installHelp() {
    const p = HQ.platform();
    const steps = {
      ios: ["Ouvrez cette page dans Safari.", "Touchez le bouton Partager (le carré avec une flèche vers le haut).", "Choisissez « Sur l'écran d'accueil », puis « Ajouter »."],
      android: ["Dans Chrome, ouvrez le menu (les trois points en haut à droite).", "Touchez « Installer l'application » (ou « Ajouter à l'écran d'accueil »).", "Si l'option n'apparaît pas, rechargez la page une fois."],
      desktop: ["Dans Chrome ou Edge, cliquez sur l'icône d'installation à droite de la barre d'adresse (un écran avec une flèche).", "Ou ouvrez le menu du navigateur (trois points), puis « Installer N29 HQ »."],
    }[p];
    U.sheet({ title: "Installer l'application", body: h("div.stack", h("ol", { style: "margin:0;padding-left:20px;display:grid;gap:10px;line-height:1.5" }, steps.map((t) => h("li", t))),
      p === "ios" ? h("div.banner.warn", "Sur iPhone, l'application installée a son propre espace de stockage, séparé de Safari. Installez-la avant de créer votre coffre, ou restaurez une sauvegarde chiffrée dans l'application installée.") : null,
      p === "desktop" ? h("p.hint", "Firefox et Safari sur ordinateur ne proposent pas l'installation : utilisez Chrome ou Edge.") : null,
      h("p.hint", "Une fois installée, l'application s'ouvre en plein écran, fonctionne hors ligne et reste verrouillée par votre phrase secrète.")) });
  }
  HQ.install = async () => {
    if (HQ.installPrompt) { const p = HQ.installPrompt; HQ.installPrompt = null; p.prompt(); try { const r = await p.userChoice; if (r.outcome === "accepted") U.toast("Installation en cours…", "ok"); else HQ.installPrompt = p; } catch (e) { /* dismissed */ } return; }
    installHelp();
  };
  HQ.installButton = (o = {}) => (HQ.isStandalone() ? null : h("button.btn.btn--" + (o.kind || "ghost") + (o.sm ? ".btn--sm" : "") + (o.block ? ".btn--block" : ""), { type: "button", dataset: { install: "1" }, onclick: HQ.install }, icon("download"), "Installer l'application"));

  // ---------- Boot ----------
  function start() {
    renderShell();
    armIdle();
    if (HQ.sync) HQ.sync.init();
    if (!location.hash) location.hash = "/";
    route();
  }
  window.addEventListener("hashchange", route);
  store.onChange(() => { if (!store.isUnlocked()) return; const b = document.querySelector(".side .backup"); if (b) { const l = backupLabel(); b.textContent = l.text; b.className = "backup" + (l.warn ? " warn" : ""); } });

  async function boot() {
    if (!store.available()) {
      app.replaceChildren(h("div.lock", h("div.lock-card", h("h1", "Navigateur non compatible"), h("p", "Cette application a besoin du chiffrement du navigateur (WebCrypto) et du stockage local. Ouvrez-la via https:// dans un navigateur récent."))));
      return;
    }
    if (store.exists()) { if (await store.tryRemembered()) { start(); return; } lockScreen("unlock"); }
    else lockScreen("create");
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  boot();
})();
