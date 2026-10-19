/* N29 HQ — encrypted cloud sync through Supabase (REST, no SDK).
   The browser encrypts the whole database with the vault key (AES-GCM) before upload: Supabase only stores ciphertext
   plus the key-derivation parameters. Devices converge through a 3-way record-level merge (merge.js).
   Issuing a legal document requires a fresh sync so numbering stays continuous across devices. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, store = HQ.store, M = HQ.merge, L = HQ.legal;
  const S = (HQ.sync = {});
  const CFG = () => HQ.syncConfig || {};
  const configured = () => !!(CFG().url && CFG().key);
  const getSt = () => { const l = store.local(); return l.sync || (l.sync = {}); };
  const enabled = () => configured() && store.isUnlocked() && !!getSt().enabled && !!getSt().session;
  S.configured = configured; S.enabled = enabled;

  // ---------- Status ----------
  const status = { state: "off", message: "" };
  const subs = new Set();
  const rel = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : U.fmtDateTime(ts); };
  S.statusText = () => {
    if (!configured()) return "Synchronisation non configurée";
    if (!store.isUnlocked() || !getSt().session) return "Synchronisation désactivée";
    const st = getSt();
    switch (status.state) {
      case "syncing": return "Synchronisation…";
      case "offline": return "Hors ligne · en attente";
      case "auth": return status.message || "Reconnexion nécessaire";
      case "error": return status.message || "Erreur de synchronisation";
      default: return st.lastSync ? `Synchronisé ${rel(st.lastSync)}` : "Connecté";
    }
  };
  const setStatus = (s) => { Object.assign(status, s); subs.forEach((f) => { try { f(status); } catch (e) { console.error(e); } }); };
  S.onStatus = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  const tone = () => (status.state === "error" || status.state === "auth" ? "var(--bad)" : status.state === "offline" ? "var(--warn)" : status.state === "syncing" ? "var(--info)" : enabled() ? "var(--ok)" : "var(--faint)");
  // Small self-updating chip (used in the sidebar and the menu).
  S.chip = () => {
    const dot = h("span.dot", { style: "--c:var(--faint)" }), txt = h("span");
    const el = h("div", { style: "display:flex;gap:8px;align-items:center" }, dot, txt);
    const upd = () => { if (!el.isConnected && el._seen) { subs.delete(upd); return; } el._seen = true; dot.style.setProperty("--c", tone()); txt.textContent = S.statusText(); };
    subs.add(upd); upd(); return el;
  };

  // ---------- HTTP ----------
  async function http(path, { method = "GET", body, token, headers = {} } = {}) {
    const res = await fetch(CFG().url + path, { method, headers: Object.assign({ apikey: CFG().key, "Content-Type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}, headers), body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json = null; if (text) { try { json = JSON.parse(text); } catch (e) { json = text; } }
    if (!res.ok) { const err = new Error((json && (json.msg || json.message || json.error_description || json.error)) || res.statusText); err.status = res.status; err.body = json; throw err; }
    return json;
  }
  const friendly = (e) => {
    const m = String(e.message || e);
    if (e.code === "auth") return m;
    if (e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(m)) return "Connexion impossible : vérifiez votre réseau.";
    if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
    if (/Email not confirmed/i.test(m)) return "Adresse non confirmée : cliquez sur le lien reçu par e-mail, puis reconnectez-vous.";
    if (/already registered/i.test(m)) return "Un compte existe déjà avec cette adresse : utilisez « Se connecter ».";
    if (/at least \d+ characters|weak/i.test(m)) return "Mot de passe trop faible (8 caractères minimum).";
    if (/rate limit|too many/i.test(m)) return "Trop de tentatives : réessayez dans quelques minutes.";
    if (e.body && e.body.code === "42501" || /row-level security/i.test(m)) return "Cette adresse e-mail n'est pas autorisée à utiliser la synchronisation.";
    return m;
  };
  const isOffline = (e) => e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(String(e.message));

  // ---------- Session ----------
  const mkSession = (r) => ({ access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at || Math.floor(Date.now() / 1000) + (r.expires_in || 3600), user: { id: r.user && r.user.id, email: r.user && r.user.email } });
  async function ensureToken() {
    const sess = getSt().session;
    if (!sess) { const e = new Error("Non connecté : ouvrez Réglages ▸ Synchronisation."); e.code = "auth"; throw e; }
    if (sess.expires_at * 1000 - Date.now() > 60000) return sess.access_token;
    try {
      const r = await http("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sess.refresh_token } });
      getSt().session = mkSession(r); store.saveLocal(); return getSt().session.access_token;
    } catch (e) {
      if (e.status === 400 || e.status === 401 || e.status === 403) { getSt().session = null; store.saveLocal(); const x = new Error("Session expirée : reconnectez-vous (Réglages ▸ Synchronisation)."); x.code = "auth"; throw x; }
      throw e;
    }
  }
  const deviceName = () => {
    const st = getSt();
    if (!st.device) { const ua = navigator.userAgent; const os = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iOS" : /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "Mac" : "Appareil"; const br = /edg/i.test(ua) ? "Edge" : /firefox/i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Navigateur"; st.device = `${os} · ${br} · ${Math.random().toString(36).slice(2, 5)}`; store.saveLocal(); }
    return st.device;
  };

  // ---------- Vault (one encrypted row per user) ----------
  const VAULT = "/rest/v1/hq_vault";
  const vaultHead = async (t) => (await http(`${VAULT}?select=rev,meta,device,updated_at`, { token: t }))[0] || null;
  const vaultFull = async (t) => (await http(`${VAULT}?select=rev,meta,data,device,updated_at`, { token: t }))[0] || null;
  async function vaultInsert(t, body) { try { return (await http(VAULT, { method: "POST", token: t, body, headers: { Prefer: "return=representation" } }))[0]; } catch (e) { if (e.status === 409) return null; throw e; } }
  async function vaultUpdate(t, rev, body) {
    try { return (await http(`${VAULT}?rev=eq.${rev}`, { method: "PATCH", token: t, body: Object.assign({ rev: rev + 1 }, body), headers: { Prefer: "return=representation" } }))[0] || null; }
    catch (e) { if (e.status === 409 || (e.body && e.body.code === "40001")) return null; throw e; }
  }
  const payload = async (view) => ({ meta: store.meta(), data: await store.encryptView(view), device: deviceName() });

  // ---------- Engine ----------
  let changeSeq = 0, syncedSeq = 0, applying = false, debounce = null, interval = null, busy = null, started = false;
  const log = (msg) => { const st = getSt(); (st.log = st.log || []).unshift({ ts: Date.now(), msg }); st.log.length = Math.min(st.log.length, 25); };
  function applyMerged(view) {
    applying = true;
    try { store.applyView(view); } finally { applying = false; }
    const busyUi = document.querySelector(".scrim") || document.querySelector("main form");
    if (!busyUi && !HQ.holdRefresh && HQ.refresh) HQ.refresh();
  }
  function askNewPassphrase(row) {
    return new Promise((resolve) => {
      setStatus({ state: "auth", message: "Phrase secrète modifiée sur un autre appareil" });
      const p = U.input({ type: "password", autocomplete: "current-password" }), err = h("p.ferr", { role: "alert" });
      const s = U.sheet({ title: "Nouvelle phrase secrète", onClose: () => resolve("cancel"), body: h("form.form", { onsubmit: async (e) => {
        e.preventDefault();
        try { await store.decryptView(row.data, row.meta, p.value); await store.adoptMeta(row.meta, p.value); s.close(true); resolve("retry"); } catch (x) { err.textContent = "Phrase secrète incorrecte."; }
      } }, h("p.muted", "La phrase secrète a été modifiée sur un autre appareil. Saisissez la nouvelle phrase pour continuer à synchroniser."), field("Nouvelle phrase secrète", p), err, h("div.form-actions", U.btn("Plus tard", { onClick: () => s.close() }), U.btn("Valider", { kind: "accent", type: "submit" }))) });
    });
  }
  const done = (seq, info) => {
    const st = getSt(); st.lastSync = Date.now();
    if (changeSeq === seq) syncedSeq = seq; else scheduleSoon();
    store.saveLocal();
    return Object.assign({ ok: true }, info);
  };
  async function attempt(opts) {
    const seq = changeSeq, st = getSt(), token = await ensureToken();
    const head = await vaultHead(token), localView = M.cloudView(store.db()), meta = store.meta();
    const dirty = opts.force || changeSeq !== syncedSeq || st.rev == null, metaChanged = st.metaSalt !== meta.salt;
    if (!head) {
      const row = await vaultInsert(token, await payload(localView));
      if (!row) return "retry";
      Object.assign(st, { rev: row.rev, base: localView, metaSalt: meta.salt }); log("Première copie envoyée"); return done(seq, { pushed: true });
    }
    if (head.rev === st.rev && !dirty && !metaChanged) return done(seq, {});
    if (head.rev === st.rev) {
      const row = await vaultUpdate(token, st.rev, await payload(localView));
      if (!row) return "retry";
      Object.assign(st, { rev: row.rev, base: localView, metaSalt: meta.salt }); log("Modifications envoyées"); return done(seq, { pushed: true });
    }
    const row = await vaultFull(token);
    if (!row) return "retry";
    let remoteView;
    try { remoteView = await store.decryptView(row.data, row.meta); }
    catch (e) { if (e.message === "need-pass") return askNewPassphrase(row); throw new Error("Copie cloud illisible (phrase secrète différente ?)."); }
    const r = M.merge(st.rev == null ? null : st.base || null, localView, remoteView);
    if (r.merged.documents.some((d) => d.number)) {
      const chain = await L.verifyChain(r.merged.documents);
      if (!chain.ok) { const e = new Error(`Fusion refusée : la chaîne d'intégrité des documents serait rompue (${chain.brokenAt}). Aucune donnée n'a été modifiée.`); e.code = "integrity"; throw e; }
    }
    if (M.canon(M.cloudView(store.db())) !== M.canon(localView)) return "retry"; // edited while syncing: merge again
    if (r.changedLocal) applyMerged(r.merged);
    let rev = row.rev;
    if (r.changedRemote || metaChanged) { const upd = await vaultUpdate(token, row.rev, await payload(r.merged)); if (!upd) return "retry"; rev = upd.rev; }
    Object.assign(st, { rev, base: r.merged, metaSalt: meta.salt });
    st.conflicts = r.conflicts.length;
    log(`Fusion : ${r.stats.pulled} reçu(s), ${r.stats.pushed} envoyé(s)${r.conflicts.length ? `, ${r.conflicts.length} conflit(s) (version de cet appareil conservée)` : ""}`);
    return done(seq, { merged: true, conflicts: r.conflicts });
  }
  async function run(opts) {
    setStatus({ state: "syncing" });
    try {
      let res = "retry";
      for (let i = 0; i < 4 && res === "retry"; i++) res = await attempt(opts);
      if (res === "retry") throw new Error("Le serveur a changé pendant la synchronisation : réessayez.");
      if (res === "cancel") { setStatus({ state: "auth", message: "Synchronisation en pause" }); return { ok: false, message: "Synchronisation en pause (phrase secrète requise)." }; }
      setStatus({ state: "idle", message: "" });
      if (res.conflicts && res.conflicts.length) U.toast(`${res.conflicts.length} conflit(s) résolu(s) : la version de cet appareil a été conservée.`);
      return res;
    } catch (e) {
      console.error("sync:", e);
      if (isOffline(e)) { setStatus({ state: "offline" }); return { ok: false, offline: true, message: friendly(e) }; }
      setStatus({ state: e.code === "auth" ? "auth" : "error", message: friendly(e) });
      return { ok: false, message: friendly(e) };
    }
  }
  S.syncNow = (opts = {}) => {
    if (!enabled()) return Promise.resolve({ ok: false, off: true });
    if (!busy) busy = run(opts).finally(() => { busy = null; });
    return busy;
  };
  const scheduleSoon = (ms = 6000) => { clearTimeout(debounce); debounce = setTimeout(() => S.syncNow({ reason: "change" }), ms); };
  S.flush = async () => { if (enabled() && changeSeq !== syncedSeq) await S.syncNow({}); };
  // Legal gate: a document can only be issued from an up-to-date copy, otherwise two devices could reuse the same number.
  S.beforeIssue = async () => {
    if (!enabled()) return { ok: true };
    const r = await S.syncNow({ force: true, reason: "issue" });
    return r && r.ok ? { ok: true } : { ok: false, message: "Synchronisation impossible : pour garder une numérotation continue entre vos appareils, l'émission est bloquée tant que la synchronisation échoue. " + ((r && r.message) || "") };
  };
  S.afterIssue = () => { if (enabled()) S.syncNow({ force: true, reason: "issue" }); };

  S.init = () => {
    if (!started) {
      started = true;
      store.onChange(() => { if (!enabled() || applying) return; changeSeq++; scheduleSoon(); });
      document.addEventListener("visibilitychange", () => { if (!document.hidden && enabled()) S.syncNow({}); });
      window.addEventListener("online", () => { if (enabled()) S.syncNow({}); });
      interval = setInterval(() => { if (enabled() && !document.hidden) S.syncNow({}); }, 90000);
    }
    changeSeq = syncedSeq + 1; // unknown local changes since the last session: treat as dirty once
    setStatus({ state: "idle" });
    if (enabled()) S.syncNow({ reason: "open", force: true });
  };

  // ---------- Account actions ----------
  async function connect(email, password, create) {
    let r = await http(create ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
    if (!r.access_token) return { confirm: true };
    const st = getSt(); st.session = mkSession(r); st.enabled = true; store.saveLocal();
    return { ok: true };
  }
  async function disconnect() {
    const st = getSt();
    try { if (st.session) await http("/auth/v1/logout", { method: "POST", token: st.session.access_token }); } catch (e) { /* offline: forget locally anyway */ }
    Object.assign(st, { session: null, enabled: false, rev: null, base: null, metaSalt: null });
    store.saveLocal(); setStatus({ state: "idle" });
  }
  async function wipeCloud() {
    const token = await ensureToken(), uid = getSt().session.user.id;
    await http(`/rest/v1/hq_vault_history?user_id=eq.${uid}`, { method: "DELETE", token });
    await http(`/rest/v1/hq_vault?user_id=eq.${uid}`, { method: "DELETE", token });
    Object.assign(getSt(), { rev: null, base: null }); store.saveLocal();
  }
  async function restoreVersion(id) {
    const token = await ensureToken();
    const row = (await http(`/rest/v1/hq_vault_history?select=meta,data,rev&id=eq.${id}`, { token }))[0];
    if (!row) throw new Error("Version introuvable.");
    const view = await store.decryptView(row.data, row.meta).catch(() => { throw new Error("Cette version a été chiffrée avec une autre phrase secrète."); });
    applyMerged(view);
    const head = await vaultHead(token), st = getSt();
    const upd = head ? await vaultUpdate(token, head.rev, await payload(view)) : await vaultInsert(token, await payload(view));
    if (!upd) throw new Error("Le serveur a changé : réessayez.");
    Object.assign(st, { rev: upd.rev, base: view, metaSalt: store.meta().salt, lastSync: Date.now() }); log(`Version ${row.rev} restaurée`); store.saveLocal();
  }

  // ---------- UI: settings panel ----------
  S.panel = function (rerender) {
    const root = h("div.stack");
    if (!configured()) { root.appendChild(h("div.banner.warn", "La synchronisation n'est pas configurée (js/sync-config.js).")); return root; }
    const st = getSt(), sess = st.session;
    const draw = () => {
      const st2 = getSt(), signed = !!st2.session;
      const dot = h("span.dot", { style: `--c:${tone()}` });
      const cards = [h("div.card", h("h2", "Synchronisation", h("small", "Supabase · chiffrée")),
        h("div", { style: "display:flex;align-items:center;gap:10px;margin-bottom:14px" }, dot, h("b", S.statusText())),
        signed ? h("dl.kv", h("dt", "Compte"), h("dd", st2.session.user.email || "—"), h("dt", "Dernière synchronisation"), h("dd", st2.lastSync ? U.fmtDateTime(st2.lastSync) : "—"), h("dt", "Version cloud"), h("dd", st2.rev != null ? "#" + st2.rev : "—"), h("dt", "Cet appareil"), h("dd", deviceName())) : null,
        signed ? h("div.head-actions", { style: "margin-top:16px" }, U.btn("Synchroniser maintenant", { kind: "accent", icon: "refresh", onClick: async () => { const r = await S.syncNow({ force: true }); U.toast(r.ok ? "Synchronisé" : r.message || "Échec de la synchronisation", r.ok ? "ok" : "bad"); } }), U.btn("Historique des versions", { icon: "clock", onClick: () => historySheet() }), U.btn("Se déconnecter", { icon: "lock", onClick: async () => { if (await U.confirm({ title: "Se déconnecter du cloud ?", text: "Vos données restent sur cet appareil ; la synchronisation s'arrête jusqu'à la prochaine connexion.", ok: "Se déconnecter" })) { await disconnect(); draw(); } } })) : signInForm())];
      if (signed) cards.push(h("div.card", h("h2", "Zone sensible"), h("p.muted", { style: "font-size:.9rem;margin-bottom:12px" }, "Supprime la copie chiffrée et son historique sur Supabase. Vos données restent sur cet appareil et sur ceux déjà synchronisés."), U.btn("Supprimer les données du cloud", { kind: "danger", icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer les données du cloud ?", text: "La copie chiffrée et ses 15 versions d'historique seront effacées de Supabase.", ok: "Supprimer", danger: true })) { try { await wipeCloud(); U.toast("Données cloud supprimées", "ok"); draw(); } catch (e) { U.toast(friendly(e), "bad"); } } } })));
      cards.push(h("div.card", h("h2", "Comment ça marche"), h("ul.compl", [
        ["Chiffrement de bout en bout", "Vos données sont chiffrées dans le navigateur avec votre phrase secrète avant l'envoi. Supabase ne voit que du texte chiffré et ne peut pas lire vos factures."],
        ["La phrase secrète ne quitte jamais l'appareil", "Elle reste la même sur tous vos appareils. Le mot de passe Supabase ci-dessus sert uniquement à ouvrir l'accès au serveur."],
        ["Fusion automatique", "Deux appareils modifiés en parallèle sont fusionnés enregistrement par enregistrement. En cas de conflit, la version de l'appareil actif est conservée."],
        ["Numérotation protégée", "Une facture ne peut être émise que depuis une copie à jour : la numérotation reste continue entre vos appareils."],
        ["Historique", "Les 15 dernières versions sont conservées côté serveur (chiffrées) pour revenir en arrière."]].map(([t, d]) => h("li", h("span.ok", "✓"), h("div", h("b", t), h("div.row-s", d)))))));
      if (signed && (st2.log || []).length) cards.push(h("div.card", h("h2", "Journal"), h("div.list", st2.log.slice(0, 12).map((l) => h("div.row", { style: "cursor:default" }, h("div.row-s", l.msg), h("div.row-s", U.fmtDateTime(l.ts)))))));
      U.set(root, ...cards);
    };
    function signInForm() {
      const email = U.input({ type: "email", autocomplete: "email", placeholder: "adresse autorisée" }), pass = U.input({ type: "password", autocomplete: "current-password" }), msg = h("p.ferr", { role: "alert" });
      const go = async (create) => {
        msg.style.color = ""; msg.textContent = "";
        if (!email.value.trim() || pass.value.length < 8) { msg.textContent = "Saisissez l'e-mail et un mot de passe de 8 caractères minimum."; return; }
        try {
          const r = await connect(email.value.trim(), pass.value, create);
          if (r.confirm) { msg.style.color = "var(--ok)"; msg.textContent = "Compte créé. Cliquez sur le lien de confirmation reçu par e-mail (une page d'erreur « localhost » après le clic est normale), puis revenez ici et touchez « Se connecter »."; return; }
          const res = await S.syncNow({ force: true });
          U.toast(res.ok ? "Synchronisation activée" : res.message || "Connecté", res.ok ? "ok" : "bad"); draw();
        } catch (e) { msg.textContent = friendly(e); }
      };
      return h("form.form", { onsubmit: (e) => { e.preventDefault(); go(false); } }, h("p.muted", { style: "font-size:.9rem" }, "Connectez-vous avec le compte Supabase de l'application. Première fois : touchez « Créer le compte »."), field("E-mail", email, { req: true }), field("Mot de passe Supabase (différent de la phrase secrète)", pass, { req: true }), msg, h("div.head-actions", U.btn("Se connecter", { kind: "accent", type: "submit", icon: "check" }), U.btn("Créer le compte", { onClick: () => go(true) })));
    }
    const off = S.onStatus(() => { if (!root.isConnected) { off(); return; } const keep = document.activeElement && root.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName); if (!keep) draw(); });
    draw();
    return root;
  };

  function historySheet() {
    const list = h("div.stack", { style: "gap:8px" }, h("p.muted", "Chargement…"));
    const s = U.sheet({ title: "Historique des versions", body: list });
    (async () => {
      try {
        const token = await ensureToken();
        const rows = await http("/rest/v1/hq_vault_history?select=id,rev,saved_at,device&order=id.desc&limit=15", { token });
        U.set(list, rows.length ? h("div.list", rows.map((r) => h("div.row", { style: "cursor:default" }, h("div", h("div.row-t", `Version #${r.rev}`), h("div.row-s", `${U.fmtDateTime(Date.parse(r.saved_at))}${r.device ? " · " + r.device : ""}`)), U.btn("Restaurer", { sm: true, onClick: async () => {
          if (!(await U.confirm({ title: `Restaurer la version #${r.rev} ?`, text: "Les données de cet appareil et du cloud reviennent à cette version ; vos autres appareils la récupéreront à leur prochaine synchronisation.", ok: "Restaurer", danger: true }))) return;
          try { await restoreVersion(r.id); s.close(true); U.toast("Version restaurée", "ok"); HQ.refresh && HQ.refresh(); } catch (e) { U.toast(friendly(e), "bad"); }
        } })))) : h("div.empty", "Aucune version précédente pour l'instant (elles apparaissent à partir de la deuxième synchronisation)."), h("p.hint", { style: "margin-top:12px" }, "Les 15 dernières versions sont conservées, chiffrées."));
      } catch (e) { U.set(list, h("div.issues", friendly(e))); }
    })();
  }

  // ---------- UI: restore on a new device (lock screen) ----------
  S.restoreSheet = function (onDone) {
    if (!configured()) { U.toast("Synchronisation non configurée.", "bad"); return; }
    const email = U.input({ type: "email", autocomplete: "email" }), pass = U.input({ type: "password", autocomplete: "current-password" }), vpass = U.input({ type: "password", autocomplete: "current-password" }), msg = h("p.ferr", { role: "alert" });
    const vwrap = field("Phrase secrète du coffre (celle de vos autres appareils)", vpass, { req: true }); vwrap.hidden = true;
    let found = null, tmp = null;
    const submit = h("button.btn.btn--accent", { type: "submit" }, "Rechercher mon coffre");
    const s = U.sheet({ title: "Restaurer depuis le cloud", body: h("form.form", { onsubmit: async (e) => {
      e.preventDefault(); msg.textContent = ""; submit.disabled = true;
      try {
        if (!found) {
          const r = await http("/auth/v1/token?grant_type=password", { method: "POST", body: { email: email.value.trim(), password: pass.value } });
          tmp = mkSession(r); found = await vaultFull(tmp.access_token);
          if (!found) { msg.textContent = "Aucun coffre trouvé dans le cloud pour ce compte."; found = null; return; }
          vwrap.hidden = false; vpass.focus(); submit.textContent = "Restaurer le coffre";
          msg.style.color = "var(--ok)"; msg.textContent = `Coffre trouvé (version #${found.rev}, ${found.device || "appareil inconnu"}). Saisissez sa phrase secrète.`;
        } else {
          msg.style.color = "";
          const view = await store.createFromCloud(found.meta, found.data, vpass.value);
          const st = getSt(); Object.assign(st, { session: tmp, enabled: true, rev: found.rev, base: view, metaSalt: found.meta.salt, lastSync: Date.now() }); log("Coffre restauré depuis le cloud");
          await store.saveLocalNow(); s.close(true); U.toast("Coffre restauré", "ok"); onDone();
        }
      } catch (x) { console.error("restore:", x); msg.style.color = ""; msg.textContent = found ? (x && x.name === "OperationError" ? "Phrase secrète incorrecte." : "Restauration impossible : " + friendly(x)) : friendly(x); } finally { submit.disabled = false; }
    } }, h("p.muted", { style: "font-size:.9rem" }, "Sur un nouvel appareil : connectez-vous au cloud, puis saisissez la phrase secrète de votre coffre pour le déchiffrer ici."), field("E-mail", email, { req: true }), field("Mot de passe Supabase", pass, { req: true }), vwrap, msg, h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), submit)) });
  };
})();
