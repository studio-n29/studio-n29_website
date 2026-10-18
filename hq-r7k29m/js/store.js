/* N29 HQ — encrypted local store.
   All data lives in this browser only: AES-GCM (256) with a key derived from the passphrase (PBKDF2-SHA256).
   Nothing is ever sent to a server. Backups are exported as files. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const KEY_META = "n29hq.meta.v1", KEY_DATA = "n29hq.data.v1", KEY_PREV = "n29hq.data.prev.v1";
  const ITER = 310000;
  const enc = new TextEncoder(), dec = new TextDecoder();

  const b64 = {
    to(buf) { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); },
    from(str) { const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; },
  };
  async function deriveKey(pass, salt, iter, extractable = false) {
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, extractable, ["encrypt", "decrypt"]);
  }
  async function encryptJSON(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
    return { iv: b64.to(iv), ct: b64.to(ct) };
  }
  async function decryptJSON(key, blob) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64.from(blob.iv) }, key, b64.from(blob.ct));
    return JSON.parse(dec.decode(pt));
  }

  // ---------- Default data ----------
  function defaultDb() {
    return {
      v: 1, createdAt: Date.now(),
      settings: {
        company: { name: "", legalForm: "EI", tradeName: "STUDIO N29", address: "", zip: "", city: "", country: "France", siret: "", ape: "", vatNumber: "", registration: "Dispensé d'immatriculation au RCS et au RM", capital: "", email: "", phone: "", website: "n29-studio.fr", iban: "", bic: "", insurance: "", mediator: "" },
        billing: {
          vatRegime: "franchise", defaultVat: 20, paymentDays: 30, quoteValidityDays: 30, operationCategory: "service", vatOnDebits: false,
          prefixInvoice: "FA", prefixQuote: "DE", prefixCredit: "AV",
          paymentMethods: "Virement bancaire", discountMention: "Pas d'escompte pour paiement anticipé.", recoveryFee: 4000,
          threshold: 7770000, vatThreshold: 3750000, noteInvoice: "", noteQuote: "",
        },
        security: { autoLockMinutes: 5, remember: false },
      },
      clients: [], projects: [], tasks: [], documents: [], payments: [], prompts: [], links: [],
      apex: { style: null, state: null }, audit: [], lastBackupAt: null,
    };
  }
  function migrate(db) {
    const d = defaultDb();
    for (const k of Object.keys(d)) if (db[k] === undefined) db[k] = d[k];
    for (const k of ["company", "billing", "security"]) db.settings[k] = Object.assign({}, d.settings[k], db.settings[k] || {});
    return db;
  }

  // ---------- Remembered key (non-extractable CryptoKey in IndexedDB) ----------
  const idb = {
    open() { return new Promise((res, rej) => { const r = indexedDB.open("n29hq", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async get() { try { const d = await this.open(); return await new Promise((res) => { const q = d.transaction("k").objectStore("k").get("key"); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } },
    async set(v) { try { const d = await this.open(); await new Promise((res, rej) => { const t = d.transaction("k", "readwrite"); t.objectStore("k").put(v, "key"); t.oncomplete = res; t.onerror = rej; }); } catch (e) { /* unavailable */ } },
    async del() { try { const d = await this.open(); await new Promise((res) => { const t = d.transaction("k", "readwrite"); t.objectStore("k").delete("key"); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* ignore */ } },
  };

  // ---------- Store ----------
  let key = null, meta = null, db = null, dirty = false, timer = null;
  const listeners = new Set();
  const S = (HQ.store = {});

  S.available = () => !!(window.crypto && crypto.subtle && window.localStorage);
  S.exists = () => { try { return !!localStorage.getItem(KEY_META); } catch (e) { return false; } };
  S.isUnlocked = () => !!db;
  S.db = () => { if (!db) throw new Error("locked"); return db; };
  S.onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const emit = () => listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });

  async function persist() {
    if (!db || !key) return;
    const blob = await encryptJSON(key, db);
    const prev = localStorage.getItem(KEY_DATA);
    if (prev) localStorage.setItem(KEY_PREV, prev);
    localStorage.setItem(KEY_DATA, JSON.stringify(blob));
    dirty = false;
  }
  S.saveNow = async () => { clearTimeout(timer); await persist(); };
  S.mutate = (fn) => {
    const r = fn(S.db());
    dirty = true; clearTimeout(timer);
    timer = setTimeout(() => persist().catch((e) => { console.error(e); HQ.util.toast("Enregistrement impossible (stockage plein ?)", "bad"); }), 350);
    emit();
    return r;
  };
  S.audit = (action, detail) => {
    const d = S.db(); d.audit.push({ ts: Date.now(), action, detail: detail || "" });
    if (d.audit.length > 3000) d.audit.splice(0, d.audit.length - 3000);
    dirty = true;
  };
  window.addEventListener("pagehide", () => { if (dirty && db && key) persist(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && dirty) persist(); });

  S.create = async (pass) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    meta = { v: 1, salt: b64.to(salt), iter: ITER };
    key = await deriveKey(pass, salt, ITER);
    db = defaultDb();
    localStorage.setItem(KEY_META, JSON.stringify(meta));
    S.audit("init", "Coffre créé");
    await persist();
    emit();
  };
  async function openWith(k) {
    const blob = JSON.parse(localStorage.getItem(KEY_DATA) || "null");
    if (!blob) throw new Error("no-data");
    try { return await decryptJSON(k, blob); }
    catch (e) {
      const prev = JSON.parse(localStorage.getItem(KEY_PREV) || "null");
      if (!prev) throw e;
      return await decryptJSON(k, prev); // fall back to the previous version if the last write was interrupted
    }
  }
  S.unlock = async (pass) => {
    meta = JSON.parse(localStorage.getItem(KEY_META));
    const k = await deriveKey(pass, b64.from(meta.salt), meta.iter);
    const data = await openWith(k);
    key = k; db = migrate(data);
    if (db.settings.security.remember) idb.set(key);
    emit();
  };
  S.tryRemembered = async () => {
    if (!S.exists()) return false;
    const k = await idb.get();
    if (!k) return false;
    try { const data = await openWith(k); key = k; db = migrate(data); meta = JSON.parse(localStorage.getItem(KEY_META)); emit(); return true; }
    catch (e) { await idb.del(); return false; }
  };
  S.setRemember = async (on) => { S.mutate((d) => { d.settings.security.remember = !!on; }); if (on) await idb.set(key); else await idb.del(); };
  S.lock = async (forget = true) => {
    if (dirty) await persist().catch(() => {});
    if (forget) await idb.del();
    key = null; db = null; emit();
  };
  S.changePassphrase = async (oldPass, newPass) => {
    const k = await deriveKey(oldPass, b64.from(meta.salt), meta.iter);
    await openWith(k); // throws if the current passphrase is wrong
    const salt = crypto.getRandomValues(new Uint8Array(16));
    meta = { v: 1, salt: b64.to(salt), iter: ITER };
    key = await deriveKey(newPass, salt, ITER);
    localStorage.setItem(KEY_META, JSON.stringify(meta));
    localStorage.removeItem(KEY_PREV);
    S.audit("passphrase", "Phrase secrète modifiée");
    await persist();
    if (db.settings.security.remember) await idb.set(key); else await idb.del();
  };
  S.wipe = async () => { [KEY_META, KEY_DATA, KEY_PREV].forEach((k) => localStorage.removeItem(k)); await idb.del(); key = null; db = null; meta = null; emit(); };

  // ---------- Backups ----------
  S.exportEncrypted = async () => {
    await persist();
    S.mutate((d) => { d.lastBackupAt = Date.now(); });
    await persist();
    return JSON.stringify({ type: "n29hq-backup-encrypted", v: 1, exportedAt: new Date().toISOString(), meta, data: JSON.parse(localStorage.getItem(KEY_DATA)) }, null, 1);
  };
  S.exportPlain = () => {
    S.mutate((d) => { d.lastBackupAt = Date.now(); S.audit("export", "Export lisible (JSON)"); });
    return JSON.stringify({ type: "n29hq-backup-plain", v: 1, exportedAt: new Date().toISOString(), db: S.db() }, null, 1);
  };
  S.importBackup = async (text, pass) => {
    const o = JSON.parse(text);
    if (o.type === "n29hq-backup-plain") {
      if (!o.db || typeof o.db !== "object") throw new Error("Fichier invalide");
      const next = migrate(o.db);
      S.mutate((d) => { Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, next); S.audit("import", "Import d'une sauvegarde lisible"); });
      await persist();
      return "plain";
    }
    if (o.type === "n29hq-backup-encrypted") {
      if (!pass) throw new Error("need-pass");
      const k = await deriveKey(pass, b64.from(o.meta.salt), o.meta.iter);
      const data = await decryptJSON(k, o.data); // throws if wrong passphrase
      meta = o.meta; key = k; db = migrate(data);
      localStorage.setItem(KEY_META, JSON.stringify(meta));
      S.audit("import", "Import d'une sauvegarde chiffrée");
      await persist();
      if (db.settings.security.remember) await idb.set(key);
      emit();
      return "encrypted";
    }
    throw new Error("Fichier de sauvegarde non reconnu");
  };
  S.peekBackupType = (text) => { try { return JSON.parse(text).type; } catch (e) { return null; } };
  S._defaultDb = defaultDb;
})();
