/* N29 HQ — shared helpers: DOM builder, formats, modal sheets, toasts, files. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = (HQ.util = {});

  // ---------- Text / ids / dates / money ----------
  U.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  const pad = (n) => String(n).padStart(2, "0");
  U.isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  U.today = () => U.isoDate(new Date());
  U.addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); const dt = new Date(y, m - 1, d + n); return U.isoDate(dt); };
  U.diffDays = (a, b) => { const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(a) - p(b)) / 86400000); };
  U.fmtDate = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
  U.fmtDateTime = (ts) => { const d = new Date(ts); return `${U.fmtDate(U.isoDate(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  const numFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  U.eur = (cents) => eurFmt.format((cents || 0) / 100);
  U.num = (cents) => numFmt.format((cents || 0) / 100);
  U.parseMoney = (v) => { const n = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? Math.round(n * 100) : 0; };
  U.parseNum = (v) => { const n = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ---------- Icons (24px grid, stroke) ----------
  const I = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    tasks: '<rect x="4" y="4" width="16" height="16"/><path d="M8 12l3 3 5-6"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.3 4.5 2.4 4.5 5.3"/>',
    tools: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    plus: '<path d="M12 4v16M4 12h16"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>', upload: '<path d="M12 17V5M7 9l5-5 5 5M4 20h16"/>',
    euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>', chevL: '<path d="M15 5l-7 7 7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>',
    print: '<path d="M7 9V3h10v6M6 17H3v-8h18v8h-3M7 14h10v7H7z"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    check: '<path d="M5 12l5 5 9-10"/>', send: '<path d="M3 11l18-8-8 18-2-8z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
    dice: '<rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/>',
    star: '<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  };
  U.icon = (name, cls) => {
    const t = document.createElement("template");
    t.innerHTML = `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ""}</svg>`;
    return t.content.firstChild;
  };
  U.iconSVG = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ""}</svg>`;
  U.LOGO = '<svg viewBox="220 255 585 515" aria-hidden="true"><g fill="currentColor"><polygon points="437,263 570,298 514,318 300,646 288,612 228,700 250,605 231,575"/><polygon points="567,350 705,400 567,581"/><polygon points="501,436 501,682 794,396 546,761 361,653"/></g></svg>';

  // ---------- DOM builder ----------
  function append(el, kid) {
    if (kid == null || kid === false || kid === true) return;
    if (Array.isArray(kid)) kid.forEach((k) => append(el, k));
    else if (kid.nodeType) el.appendChild(kid);
    else el.appendChild(document.createTextNode(String(kid)));
  }
  U.h = function h(sel, attrs, ...kids) {
    if (attrs != null && (typeof attrs !== "object" || attrs.nodeType || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    const tag = (/^[a-z][a-z0-9]*/i.exec(sel) || ["div"])[0];
    const el = document.createElement(tag);
    const id = /#([\w-]+)/.exec(sel); if (id) el.id = id[1];
    const cls = sel.match(/\.[\w-]+/g); if (cls) el.className = cls.map((c) => c.slice(1)).join(" ");
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className += (el.className ? " " : "") + v;
        else if (k === "style") { if (typeof v === "string") el.style.cssText = v; else Object.assign(el.style, v); }
        else if (k === "html") el.innerHTML = v;
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "value" || k === "checked" || k === "selected" || k === "disabled" || k === "hidden") el[k] = v;
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    append(el, kids);
    return el;
  };
  const h = U.h;
  U.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  U.set = (el, ...kids) => { U.clear(el); append(el, kids); return el; }; // null-safe replaceChildren

  // ---------- Form helpers ----------
  let fid = 0;
  U.field = (label, control, o = {}) => {
    const wrap = h("div.field" + (o.cls ? "." + o.cls : ""));
    let lab = null;
    if (label) {
      lab = h("label", label, o.req ? h("em", " *") : null);
      if (control && /^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName)) { control.id = control.id || "f" + ++fid; lab.htmlFor = control.id; }
      wrap.appendChild(lab);
    }
    wrap.appendChild(control);
    if (o.hint) wrap.appendChild(h("span.hint", o.hint));
    return wrap;
  };
  U.input = (props = {}) => h("input", Object.assign({ type: "text", autocomplete: "off" }, props));
  U.textarea = (props = {}) => h("textarea", props);
  U.select = (options, value, props = {}) => {
    const s = h("select", props);
    options.forEach((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; s.appendChild(h("option", { value: v }, l)); });
    if (value != null) s.value = value;
    return s;
  };
  U.btn = (label, o = {}) => h("button", { type: o.type || "button", class: `btn btn--${o.kind || "ghost"}${o.sm ? " btn--sm" : ""}${o.block ? " btn--block" : ""}`, onclick: o.onClick, disabled: o.disabled, title: o.title }, o.icon ? U.icon(o.icon) : null, label);
  U.iconBtn = (icon, label, onClick, extra = "") => h("button", { type: "button", class: "icon-btn " + extra, "aria-label": label, title: label, onclick: onClick }, U.icon(icon));

  // ---------- Toasts ----------
  let toasts;
  U.toast = (msg, kind) => {
    if (!toasts || !toasts.isConnected) { toasts = h("div.toasts", { "aria-live": "polite" }); document.body.appendChild(toasts); }
    const t = h("div.toast" + (kind ? "." + kind : ""), msg);
    toasts.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, kind === "bad" ? 4200 : 2200);
  };

  // ---------- Sheets / confirm ----------
  let sheets = 0;
  U.sheet = ({ title, body, wide, onClose }) => {
    const prevFocus = document.activeElement;
    const closeBtn = U.iconBtn("x", "Fermer", () => close());
    const bodyEl = h("div.sheet-body", body);
    const sheet = h("div.sheet" + (wide ? ".wide" : ""), h("div.sheet-head", h("h2", title), closeBtn), bodyEl);
    const scrim = h("div.scrim", { role: "dialog", "aria-modal": "true", "aria-label": title }, sheet);
    let closed = false;
    function close(silent) {
      if (closed) return; closed = true;
      document.removeEventListener("keydown", onKey, true);
      scrim.classList.remove("in");
      setTimeout(() => scrim.remove(), 220);
      if (--sheets === 0) document.documentElement.style.overflow = "";
      if (!silent && onClose) onClose();
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* gone */ }
    }
    function onKey(e) { if (e.key === "Escape" && scrim === [...document.querySelectorAll(".scrim")].pop()) { e.stopPropagation(); close(); } }
    scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) close(); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(scrim);
    if (sheets++ === 0) document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => { scrim.classList.add("in"); const f = bodyEl.querySelector("input:not([type=hidden]),select,textarea"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus(); });
    return { close, el: sheet, body: bodyEl };
  };
  U.confirm = ({ title, text, ok = "Confirmer", danger, cancel = "Annuler" }) => new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; s.close(true); resolve(v); };
    const s = U.sheet({ title, onClose: () => finish(false), body: h("div.stack", h("p", { style: "color:var(--muted)" }, text), h("div.form-actions", U.btn(cancel, { onClick: () => finish(false) }), U.btn(ok, { kind: danger ? "danger" : "accent", onClick: () => finish(true) }))) });
  });

  // ---------- Files / clipboard ----------
  U.download = (name, text, mime = "application/json") => {
    const a = h("a", { href: URL.createObjectURL(new Blob([text], { type: mime + ";charset=utf-8" })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  U.pickFile = (accept) => new Promise((resolve) => {
    const i = h("input", { type: "file", accept, style: "position:fixed;left:-999px" });
    i.addEventListener("change", () => { resolve(i.files[0] || null); i.remove(); });
    document.body.appendChild(i); i.click();
  });
  U.readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
  U.printHTML = (html) => {
    let r = document.getElementById("print-root"); if (r) r.remove();
    r = h("div#print-root", { html }); document.body.appendChild(r);
    const done = () => { r.remove(); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); setTimeout(() => window.print(), 60);
  };
  U.copy = async (text, msg = "Copié") => {
    try { await navigator.clipboard.writeText(text); U.toast(msg, "ok"); }
    catch (e) {
      const ta = h("textarea", { value: text, style: "position:fixed;left:-999px" }); document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); U.toast(msg, "ok"); } catch (err) { U.toast("Copie impossible : sélectionnez le texte.", "bad"); }
      ta.remove();
    }
  };
  U.csv = (rows) => "﻿" + rows.map((r) => r.map((c) => { const s = String(c == null ? "" : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";")).join("\r\n");
})();
