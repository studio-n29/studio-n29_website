/* Quotes & invoices: list, editor, issuing (locked + hash chain), A4 preview / PDF, payments, credit notes, deposits. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, esc = U.esc, store = HQ.store, L = HQ.legal;
  HQ.views = HQ.views || {};

  const CATEGORIES = [["service", "Prestation de services"], ["goods", "Livraison de biens"], ["mixed", "Mixte (biens et services)"]];
  const REGIMES = [["franchise", "Franchise en base de TVA (art. 293 B du CGI)"], ["normal", "TVA applicable"], ["autoliq", "Autoliquidation (client UE assujetti)"]];
  const STATE_UI = {
    draft: ["Brouillon", ""], issued: ["Émise", "acc"], partial: ["Paiement partiel", "info"], paid: ["Payée", "ok"], overdue: ["En retard", "bad"], credited: ["Annulée (avoir)", "warn"],
    sent: ["Envoyé", "acc"], accepted: ["Accepté", "ok"], declined: ["Refusé", "bad"], expired: ["Expiré", "warn"], invoiced: ["Facturé", "ok"],
  };
  const catLabel = (k) => (CATEGORIES.find((c) => c[0] === k) || [0, ""])[1];

  const stateOf = (doc, db) => (doc.type === "quote" ? L.quoteState(doc, U.today()) : L.invoiceState(doc, db.payments, db.documents, U.today()));
  const badge = (st) => { const [l, c] = STATE_UI[st] || [st, ""]; return h("span.badge" + (c ? "." + c : ""), l); };
  const blankLine = (bl) => ({ id: U.uid(), desc: "", qty: 1, unit: 0, unitLabel: "jour", discount: 0, vat: bl.defaultVat });

  // ---------- Normalised view of a document (snapshot if issued, live otherwise) ----------
  function snapshotParties(doc, db) {
    const co = db.settings.company;
    const seller = doc.seller || Object.assign({}, co);
    const cl = doc.client || (db.clients.find((c) => c.id === doc.clientId) || null);
    return { seller, client: cl ? Object.assign({}, cl) : {} };
  }
  function viewOf(doc, db) {
    const { seller, client } = snapshotParties(doc, db);
    const full = Object.assign({}, doc, { seller, client });
    const totals = doc.number ? doc.totals : L.totals(doc);
    full.totals = totals;
    const mentions = doc.number ? doc.mentions : L.mentions(full, db.settings.billing);
    return { doc: full, seller, client, totals, mentions };
  }

  // ---------- A4 paper ----------
  function paperHTML(doc, db) {
    const v = viewOf(doc, db), s = v.seller, c = v.client, t = v.totals, showVat = doc.vatRegime === "normal";
    const issued = !!doc.number;
    const title = L.TYPE_LABEL[doc.type].toUpperCase();
    const addr = (o) => [o.address, [o.zip, o.city].filter(Boolean).join(" "), o.country && o.country !== "France" ? o.country : ""].filter(Boolean).map(esc).join("<br>");
    const meta = [
      ["Date d'émission", U.fmtDate(doc.issueDate)],
      doc.type !== "quote" && doc.type !== "credit" ? ["Date de prestation", U.fmtDate(doc.serviceDate)] : null,
      doc.type === "quote" ? ["Valable jusqu'au", U.fmtDate(doc.validUntil)] : null,
      doc.type !== "quote" && doc.type !== "credit" ? ["Échéance", U.fmtDate(doc.dueDate)] : null,
      doc.refNumber ? [doc.type === "credit" ? "Facture d'origine" : "Devis", doc.refNumber] : null,
      doc.type !== "quote" ? ["Opération", catLabel(doc.category)] : null,
    ].filter(Boolean);
    const rows = (doc.lines || []).map((l, i) => {
      const lt = t.lines[i] || { ht: 0, rate: 0 };
      return `<tr><td>${esc(l.desc).replace(/\n/g, "<br>")}</td><td class="n">${esc(String(l.qty).replace(".", ","))}</td><td>${esc(l.unitLabel || "")}</td><td class="n">${U.num(l.unit)}</td><td class="n">${l.discount ? esc(l.discount) + " %" : ""}</td>${showVat ? `<td class="n">${esc(String(lt.rate).replace(".", ","))} %</td>` : ""}<td class="n">${U.num(lt.ht)}</td></tr>`;
    }).join("");
    const vatRows = showVat ? t.byRate.map((r) => `<div><span>TVA ${esc(String(r.rate).replace(".", ","))} % sur ${U.num(r.ht)}</span><span>${U.num(r.vat)} €</span></div>`).join("") : "";
    const dep = (doc.deposits || []).map((d) => `<div><span>Acompte facture ${esc(d.number)}</span><span>− ${U.num(d.ttc)} €</span></div>`).join("");
    const bank = doc.type !== "quote" && doc.type !== "credit" && (s.iban || s.bic) ? `<p><b>Règlement par virement</b> — IBAN : ${esc(s.iban || "")}${s.bic ? " · BIC : " + esc(s.bic) : ""}${doc.number ? " · Référence : " + esc(doc.number) : ""}</p>` : "";
    return `<div class="paper">
      ${!issued ? '<div class="stamp">BROUILLON</div>' : ""}
      <div class="p-head"><div><div class="p-logo">${U.LOGO}<span>${esc((s.tradeName || "STUDIO N29").toUpperCase())}</span></div></div>
        <div class="p-meta"><h1>${esc(title)}</h1><b>${esc(doc.number || "— brouillon —")}</b></div></div>
      <div class="p-parties">
        <div class="p-box"><h4>Émetteur</h4><b>${esc(L.sellerLabel(s) || "—")}</b><br>${addr(s)}<br>${s.siret ? "SIRET : " + esc(s.siret) + "<br>" : ""}${s.vatNumber ? "TVA : " + esc(s.vatNumber) + "<br>" : ""}${[s.email, s.phone].filter(Boolean).map(esc).join(" · ")}</div>
        <div class="p-box"><h4>Client</h4><b>${esc(c.name || "—")}</b>${c.contact ? "<br>" + esc(c.contact) : ""}<br>${addr(c)}<br>${c.siren ? "SIREN : " + esc(c.siren) + "<br>" : ""}${c.vatNumber ? "TVA : " + esc(c.vatNumber) + "<br>" : ""}${c.deliveryAddress ? "<br><i>Livraison / exécution :</i><br>" + esc(c.deliveryAddress).replace(/\n/g, "<br>") : ""}</div>
      </div>
      <table style="margin-bottom:14px"><tbody>${meta.map(([k, val]) => `<tr><td style="width:34%;color:#6c6a78;padding:3px 6px;border:0">${esc(k)}</td><td style="padding:3px 6px;border:0"><b>${esc(val)}</b></td></tr>`).join("")}</tbody></table>
      <table><thead><tr><th>Désignation</th><th class="n">Qté</th><th>Unité</th><th class="n">PU HT</th><th class="n">Rem.</th>${showVat ? '<th class="n">TVA</th>' : ""}<th class="n">Total HT</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="p-totals"><div><span>Total HT</span><span>${U.num(t.ht)} €</span></div>${vatRows}${showVat ? `<div><span>Total TVA</span><span>${U.num(t.vat)} €</span></div>` : ""}<div class="g"><span>Total TTC</span><span>${U.num(t.ttc)} €</span></div>${dep}${dep ? `<div class="g"><span>Net à payer</span><span>${U.num(t.due)} €</span></div>` : ""}</div>
      ${doc.notes ? `<p style="margin-top:18px">${esc(doc.notes).replace(/\n/g, "<br>")}</p>` : ""}
      ${doc.type === "quote" ? '<div class="p-sign"><div>Bon pour accord, date et signature du client :</div><div>Cachet / signature de l\'émetteur :</div></div>' : ""}
      <div class="p-foot">${bank}${v.mentions.map((m) => `<p>${esc(m)}</p>`).join("")}${issued ? `<div class="p-hash">Pièce n° ${esc(doc.number)} · rang ${doc.chainIndex} · empreinte SHA-256 ${esc(doc.hash)}</div>` : ""}</div>
    </div>`;
  }
  function fitPaper(wrap) {
    const paper = wrap.querySelector(".paper"); if (!paper) return;
    const fit = () => { const sc = Math.min(1, (wrap.clientWidth - 2) / 794); paper.style.transformOrigin = "top left"; paper.style.transform = sc < 1 ? `scale(${sc})` : ""; wrap.style.height = sc < 1 ? Math.ceil(paper.offsetHeight * sc) + 4 + "px" : ""; wrap.style.overflow = sc < 1 ? "hidden" : ""; };
    fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  }
  function printDoc(doc, db) {
    let root = document.getElementById("print-root"); if (root) root.remove();
    root = h("div#print-root", { html: paperHTML(doc, db) }); document.body.appendChild(root);
    const done = () => { root.remove(); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); setTimeout(() => window.print(), 60);
  }
  function previewSheet(doc, db) {
    const wrap = h("div.paper-wrap", { html: paperHTML(doc, db) });
    const s = U.sheet({ title: doc.number || "Aperçu du brouillon", wide: true, body: h("div.stack", h("div.form-actions", { style: "justify-content:flex-start" }, U.btn("Imprimer / Enregistrer en PDF", { kind: "accent", icon: "print", onClick: () => printDoc(doc, db) })), wrap) });
    requestAnimationFrame(() => fitPaper(wrap));
  }

  // ---------- Drafts ----------
  function newDraft(type, db, q) {
    const bl = db.settings.billing, today = U.today();
    const doc = { id: U.uid(), type, number: null, status: "draft", createdAt: Date.now(), clientId: q.client || "", issueDate: today, serviceDate: type === "quote" ? "" : today, dueDate: type === "quote" || type === "credit" ? "" : U.addDays(today, bl.paymentDays), validUntil: type === "quote" ? U.addDays(today, bl.quoteValidityDays) : "", vatRegime: bl.vatRegime, vatOnDebits: bl.vatOnDebits, category: bl.operationCategory, lines: [], notes: "", paymentMethods: bl.paymentMethods, deposits: [], refId: "", refNumber: "", refDate: "", quoteId: "" };
    const src = q.from ? db.documents.find((d) => d.id === q.from) : null;
    const dup = q.dup ? db.documents.find((d) => d.id === q.dup) : null;
    const copyLines = (s, sign = 1) => s.lines.map((l) => Object.assign({}, l, { id: U.uid(), qty: l.qty * sign }));
    if (dup) { Object.assign(doc, { clientId: dup.clientId, vatRegime: dup.vatRegime, vatOnDebits: dup.vatOnDebits, category: dup.category, notes: dup.notes, lines: copyLines(dup) }); }
    else if (src && type === "invoice" && src.type === "quote") {
      Object.assign(doc, { clientId: src.clientId, vatRegime: src.vatRegime, vatOnDebits: src.vatOnDebits, category: src.category, notes: src.notes, lines: copyLines(src), quoteId: src.id, refId: src.id, refNumber: src.number, refDate: src.issueDate });
      doc.deposits = db.documents.filter((d) => d.type === "deposit" && d.quoteId === src.id && d.number).map((d) => ({ number: d.number, ttc: d.totals.ttc, date: d.issueDate }));
    } else if (src && type === "deposit" && src.type === "quote") {
      const pct = Math.min(100, Math.max(1, Number(q.pct) || 30)), t = L.totals(src);
      Object.assign(doc, { clientId: src.clientId, vatRegime: src.vatRegime, vatOnDebits: src.vatOnDebits, category: src.category, quoteId: src.id, refId: src.id, refNumber: src.number, refDate: src.issueDate });
      doc.lines = t.byRate.map((r) => ({ id: U.uid(), desc: `Acompte de ${pct} % — devis n° ${src.number}${src.vatRegime === "normal" ? ` (TVA ${String(r.rate).replace(".", ",")} %)` : ""}`, qty: 1, unit: Math.round((r.ht * pct) / 100), unitLabel: "forfait", discount: 0, vat: r.rate }));
    } else if (src && type === "credit" && src.type !== "quote") {
      Object.assign(doc, { clientId: src.clientId, vatRegime: src.vatRegime, vatOnDebits: src.vatOnDebits, category: src.category, serviceDate: src.serviceDate, refId: src.id, refNumber: src.number, refDate: src.issueDate, lines: copyLines(src, -1), paymentMethods: "" });
    }
    if (!doc.lines.length) doc.lines.push(blankLine(bl));
    return doc;
  }

  // ---------- Issue (lock + number + chain) ----------
  async function issueDoc(draft) {
    const db = store.db(), bl = db.settings.billing;
    const { seller, client } = { seller: Object.assign({}, db.settings.company), client: Object.assign({}, db.clients.find((c) => c.id === draft.clientId) || {}) };
    const full = JSON.parse(JSON.stringify(draft));
    full.seller = seller; full.client = client; full.totals = L.totals(full);
    const res = L.validate(full, db.settings, db.documents, { today: U.today() });
    if (res.errors.length) return { ok: false, errors: res.errors };
    full.number = L.nextNumber(db.documents, full, bl, full.issueDate);
    full.mentions = L.mentions(full, bl);
    const last = db.documents.filter((d) => d.number).sort((a, b) => a.chainIndex - b.chainIndex).pop();
    full.chainIndex = last ? last.chainIndex + 1 : 1; full.prevHash = last ? last.hash : "";
    full.hash = await L.hashDoc(full, full.prevHash);
    full.status = full.type === "quote" ? "sent" : "issued"; full.issuedAt = Date.now();
    store.mutate((d) => {
      const i = d.documents.findIndex((x) => x.id === full.id);
      if (i >= 0) d.documents[i] = full; else d.documents.push(full);
      if (full.type === "invoice" && full.quoteId) { const q = d.documents.find((x) => x.id === full.quoteId); if (q) q.status = "invoiced"; }
      store.audit("document.issue", `${full.number} — ${client.name} — ${U.eur(full.totals.ttc)}`);
    });
    await store.saveNow();
    return { ok: true, doc: full };
  }

  // ---------- Payment sheet ----------
  function paymentSheet(doc, done) {
    const db = store.db();
    const bal = L.balance(doc, db.payments, db.documents);
    const f = { amount: U.input({ value: String((bal / 100).toFixed(2)).replace(".", ","), inputmode: "decimal" }), date: U.input({ type: "date", value: U.today() }), method: U.select(L.PAYMENT_METHODS, "Virement bancaire"), note: U.input({ placeholder: "Référence du virement, n° de chèque…" }) };
    const err = h("p.ferr", { role: "alert" });
    const s = U.sheet({ title: `Paiement — ${doc.number}`, body: h("form.form", { onsubmit: (e) => {
      e.preventDefault();
      const amount = U.parseMoney(f.amount.value);
      if (amount <= 0) { err.textContent = "Montant invalide."; return; }
      if (amount > bal) { err.textContent = `Le montant dépasse le solde dû (${U.eur(bal)}).`; return; }
      if (!f.date.value) { err.textContent = "Date manquante."; return; }
      store.mutate((d) => { d.payments.push({ id: U.uid(), docId: doc.id, date: f.date.value, amount, method: f.method.value, note: f.note.value.trim() }); store.audit("payment.add", `${doc.number} — ${U.eur(amount)} le ${U.fmtDate(f.date.value)}`); });
      s.close(true); U.toast("Paiement enregistré", "ok"); done();
    } }, h("p.muted", `Solde dû : ${U.eur(bal)}`), h("div.r2", field("Montant reçu (€)", f.amount, { req: true }), field("Date de réception", f.date, { req: true })), h("div.r2", field("Mode de règlement", f.method), field("Note", f.note)), err, h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
  }

  // =====================================================================
  // LIST
  // =====================================================================
  HQ.views.docs = function (root, ctx) {
    const db = store.db();
    let type = ctx.query.type || "all", status = ctx.query.status || "all", q = "", clientId = ctx.query.client || "";
    const draw = () => { drawSeg(); drawList(); };
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Gestion"), h("h1", "Devis & factures")), h("div.head-actions", U.btn("Devis", { icon: "plus", onClick: () => HQ.go("/docs/new/quote" + (clientId ? "?client=" + clientId : "")) }), U.btn("Facture", { kind: "accent", icon: "plus", onClick: () => HQ.go("/docs/new/invoice" + (clientId ? "?client=" + clientId : "")) }))));
    const segT = h("div.seg"), segS = h("div.seg"), search = U.input({ type: "search", placeholder: "N°, client, désignation…" });
    const sums = h("div.grid.c3", { style: "margin-bottom:14px" }), list = h("div.list");
    root.append(...[h("div.toolbar", h("div.search", icon("search"), search)), h("div.toolbar", segT, segS), clientId ? h("div.banner", { style: "margin-bottom:14px" }, "Filtré sur un client. ", h("a", { href: "#/docs", style: "text-decoration:underline" }, "Tout afficher")) : null, sums, h("div.card", list)].filter(Boolean));
    const mk = (cur, items, set) => items.map(([k, l]) => h("button", { type: "button", "aria-pressed": String(cur === k), onclick: () => { set(k); draw(); } }, l));
    function drawSeg() {
      segT.replaceChildren(...mk(type, [["all", "Tout"], ["quote", "Devis"], ["invoice", "Factures"], ["credit", "Avoirs"]], (k) => (type = k)));
      segS.replaceChildren(...mk(status, [["all", "Tous statuts"], ["draft", "Brouillons"], ["open", "À encaisser"], ["overdue", "En retard"], ["paid", "Payées"]], (k) => (status = k)));
    }
    function drawList() {
      const nq = U.norm(q);
      const items = db.documents.filter((d) => {
        if (type !== "all" && (type === "invoice" ? d.type !== "invoice" && d.type !== "deposit" : d.type !== type)) return false;
        if (clientId && d.clientId !== clientId) return false;
        const st = stateOf(d, db);
        if (status === "draft" && st !== "draft") return false;
        if (status === "open" && !["issued", "partial", "overdue"].includes(st)) return false;
        if (status === "overdue" && st !== "overdue") return false;
        if (status === "paid" && st !== "paid") return false;
        if (nq) { const cl = d.client || db.clients.find((c) => c.id === d.clientId) || {}; if (!U.norm([d.number, cl.name, ...(d.lines || []).map((l) => l.desc)].join(" ")).includes(nq)) return false; }
        return true;
      }).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "") || b.createdAt - a.createdAt);
      const inv = items.filter((d) => d.number && d.type !== "quote" && d.type !== "credit");
      sums.replaceChildren(
        h("div.stat", h("small", "Pièces affichées"), h("b", String(items.length))),
        h("div.stat", h("small", "Facturé TTC"), h("b", U.eur(inv.reduce((s, d) => s + d.totals.ttc, 0)))),
        h("div.stat" + (inv.some((d) => stateOf(d, db) === "overdue") ? ".warn" : ""), h("small", "Reste à encaisser"), h("b", U.eur(inv.reduce((s, d) => s + Math.max(0, L.balance(d, db.payments, db.documents)), 0)))));
      list.replaceChildren();
      if (!items.length) { list.appendChild(h("div.empty", db.documents.length ? "Aucune pièce ne correspond à ces filtres." : "Aucun document. Créez votre premier devis ou votre première facture.")); return; }
      items.forEach((d) => {
        const cl = d.client || db.clients.find((c) => c.id === d.clientId) || {}, st = stateOf(d, db), tt = d.number ? d.totals : L.totals(d);
        list.appendChild(h("a.row", { href: "#/docs/" + d.id },
          h("div", h("div.row-t", d.number || `${L.TYPE_LABEL[d.type]} (brouillon)`), h("div.row-s", [cl.name || "Client à choisir", U.fmtDate(d.issueDate), d.type === "quote" ? "devis" : d.type === "credit" ? "avoir" : d.type === "deposit" ? "acompte" : null].filter(Boolean).join(" · "))),
          h("div.row-r", h("b", U.eur(tt.ttc)), badge(st))));
      });
    }
    search.addEventListener("input", () => { q = search.value; drawList(); });
    draw();
  };

  // =====================================================================
  // EDITOR / VIEWER
  // =====================================================================
  HQ.views.docEdit = function (root, ctx) {
    HQ.rerender = ctx.rerender;
    const db = store.db();
    if (ctx.params.type) return editor(root, ctx, newDraft(ctx.params.type, db, ctx.query), true);
    const doc = db.documents.find((d) => d.id === ctx.params.id);
    if (!doc) { root.appendChild(h("div.empty", "Document introuvable. ", h("a", { href: "#/docs", style: "text-decoration:underline" }, "Retour à la liste"))); return; }
    return doc.number ? viewer(root, ctx, doc) : editor(root, ctx, JSON.parse(JSON.stringify(doc)), false);
  };

  // ----- Editor -----
  function editor(root, ctx, doc, isNew) {
    const db = store.db(), bl = db.settings.billing;
    const isQuote = doc.type === "quote", isCredit = doc.type === "credit";
    const title = `${isNew ? "Nouveau" : "Modifier"} · ${L.TYPE_LABEL[doc.type].toLowerCase()}`;
    root.appendChild(h("div.page-head", h("div", h("a.back", { href: "#/docs" }, icon("chevL"), "Documents"), h("div.eyebrow", title), h("h1", doc.refNumber ? `${L.TYPE_LABEL[doc.type]} · ${doc.refNumber}` : L.TYPE_LABEL[doc.type]))));

    // Client
    const clientSel = h("select"), clientBox = h("div");
    const fillClients = (sel) => { clientSel.replaceChildren(h("option", { value: "" }, "— choisir un client —"), ...db.clients.slice().sort((a, b) => a.name.localeCompare(b.name, "fr")).map((c) => h("option", { value: c.id }, c.name)), h("option", { value: "__new__" }, "+ Nouveau client…")); clientSel.value = sel || ""; };
    fillClients(doc.clientId);
    clientSel.addEventListener("change", () => {
      if (clientSel.value === "__new__") { clientSel.value = doc.clientId || ""; HQ.clients.openSheet(null, (id) => { fillClients(id); doc.clientId = id; refresh(); }); return; }
      doc.clientId = clientSel.value; refresh();
    });

    // Dates / regime
    const f = {
      issueDate: U.input({ type: "date", value: doc.issueDate }), serviceDate: U.input({ type: "date", value: doc.serviceDate }), dueDate: U.input({ type: "date", value: doc.dueDate }), validUntil: U.input({ type: "date", value: doc.validUntil }),
      vatRegime: U.select(REGIMES, doc.vatRegime), category: U.select(CATEGORIES, doc.category), vatOnDebits: h("input", { type: "checkbox", checked: !!doc.vatOnDebits }),
      paymentMethods: U.input({ value: doc.paymentMethods || "" }), notes: U.textarea({ rows: 3, value: doc.notes || "" }),
    };
    const bind = (k) => f[k].addEventListener("input", () => { doc[k] = f[k].type === "checkbox" ? f[k].checked : f[k].value; refresh(); });
    ["issueDate", "serviceDate", "dueDate", "validUntil", "vatRegime", "category", "vatOnDebits", "paymentMethods", "notes"].forEach(bind);
    f.vatRegime.addEventListener("change", () => { drawLines(); });
    const quickDue = (days) => h("button.chip", { type: "button", onclick: () => { const base = doc.issueDate || U.today(); const v = U.addDays(base, days); if (isQuote) { f.validUntil.value = v; doc.validUntil = v; } else { f.dueDate.value = v; doc.dueDate = v; } refresh(); } }, days === 0 ? "À réception" : `${days} j`);

    // Lines
    const linesBox = h("div.lines"), totalsBox = h("div.totals"), issuesBox = h("div");
    function lineEl(l, i) {
      const num = (k, extra = {}) => { const el = U.input(Object.assign({ value: k === "unit" ? String(l.unit / 100).replace(".", ",") : String(l[k]).replace(".", ","), inputmode: "decimal" }, extra)); el.addEventListener("input", () => { l[k] = k === "unit" ? U.parseMoney(el.value) : U.parseNum(el.value); refresh(true); }); return el; };
      const desc = U.textarea({ rows: 2, value: l.desc, placeholder: "Désignation (ex. Développement gameplay Unity — système de combat)" }); desc.addEventListener("input", () => { l.desc = desc.value; refresh(true); });
      const unitSel = U.select(L.UNITS, l.unitLabel || "jour"); unitSel.addEventListener("change", () => { l.unitLabel = unitSel.value; refresh(true); });
      const vat = U.select(L.VAT_RATES.map((r) => [String(r), String(r).replace(".", ",") + " %"]), String(l.vat)); vat.addEventListener("change", () => { l.vat = Number(vat.value); refresh(true); });
      const showVat = doc.vatRegime === "normal";
      const ht = h("b", U.eur(L.lineHT(l)));
      const el = h("div.line", { dataset: { i } },
        h("div.desc", field("Désignation", desc)), h("div.f3", field("Quantité", num("qty"))), h("div.f3", field("Unité", unitSel)), h("div.f2", field("Prix unit. HT (€)", num("unit"))),
        h("div.f3", field("Remise %", num("discount"))), h("div.f3" + (showVat ? "" : ".nov"), showVat ? field("TVA", vat) : h("span")),
        h("div.fx", h("span", "Total HT"), ht, doc.lines.length > 1 ? U.iconBtn("trash", "Supprimer la ligne", () => { doc.lines.splice(i, 1); drawLines(); refresh(); }, "danger") : null));
      el._ht = ht; return el;
    }
    function drawLines() { linesBox.replaceChildren(...doc.lines.map(lineEl)); refresh(true); }
    const addRow = h("div.pill-row", { style: "margin-top:12px" },
      U.btn("Ajouter une ligne", { icon: "plus", sm: true, onClick: () => { doc.lines.push(blankLine(bl)); drawLines(); } }),
      db.settings.billing.dailyRate ? U.btn("Journée (TJM)", { sm: true, onClick: () => { doc.lines.push(Object.assign(blankLine(bl), { desc: "Développement Unity — journée", unit: Number(db.settings.billing.dailyRate) || 0, unitLabel: "jour" })); drawLines(); } }) : null);

    // Info blocks
    const clientCard = h("div.card", h("h2", "Client"), field("", clientSel), clientBox);
    const datesGrid = h("div.form.r2", { style: "display:grid;gap:14px" }, field("Date d'émission", f.issueDate, { req: true }),
      isQuote ? field("Valable jusqu'au", f.validUntil, { req: true }) : isCredit ? null : field("Date (ou période) de prestation", f.serviceDate, { req: true }),
      !isQuote && !isCredit ? field("Échéance de paiement", f.dueDate, { req: true }) : null);
    const quick = !isCredit ? h("div.pill-row", { style: "margin-top:10px" }, h("span.hint", { style: "align-self:center" }, isQuote ? "Validité :" : "Échéance :"), (isQuote ? [15, 30, 60, 90] : [0, 15, 30, 45, 60]).map(quickDue)) : null;
    const vatCard = h("div.card", h("h2", "TVA & nature de l'opération"), h("div.form.r2", { style: "display:grid;gap:14px" }, field("Régime de TVA", f.vatRegime), isQuote ? null : field("Catégorie d'opération", f.category)),
      h("label.check", { style: "margin-top:8px" }, f.vatOnDebits, "Option pour le paiement de la TVA d'après les débits"));
    const linesCard = h("div.card", h("h2", "Lignes", h("small", "montants en € HT")), linesBox, addRow, h("div", { style: "margin-top:18px" }, totalsBox));
    const notesCard = h("div.card", h("h2", "Paiement & notes"), h("div.form", isQuote || isCredit ? null : field("Mode(s) de règlement acceptés", f.paymentMethods), field("Notes visibles sur le document", f.notes, { hint: "Ex. précisions de livraison, conditions particulières." })));
    const depCard = (doc.deposits || []).length ? h("div.banner", `Acomptes déjà facturés, déduits du net à payer : ${doc.deposits.map((d) => `${d.number} (${U.eur(d.ttc)})`).join(", ")}.`) : null;

    const actions = h("div.form-actions", { style: "position:sticky;bottom:calc(var(--tab-h) + var(--safe-b) + 8px);z-index:5;background:var(--bg);padding:10px 0;border-top:1px solid var(--line);margin-top:6px" },
      !isNew ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer ce brouillon ?", text: "Cette action est définitive.", ok: "Supprimer", danger: true })) { store.mutate((d) => { d.documents = d.documents.filter((x) => x.id !== doc.id); }); HQ.go("/docs"); } } }) : null,
      U.btn("Aperçu", { icon: "print", onClick: () => previewSheet(doc, store.db()) }),
      U.btn("Enregistrer", { icon: "check", onClick: () => { save(); U.toast("Brouillon enregistré", "ok"); } }),
      U.btn(isQuote ? "Émettre le devis" : isCredit ? "Émettre l'avoir" : "Émettre la facture", { kind: "accent", icon: "send", onClick: startIssue }));
    root.append(h("div.stack", depCard, clientCard, h("div.card", h("h2", "Dates"), datesGrid, quick), isCredit ? null : vatCard, linesCard, notesCard, issuesBox, actions));

    function save() {
      const clean = JSON.parse(JSON.stringify(doc));
      store.mutate((d) => { const i = d.documents.findIndex((x) => x.id === clean.id); if (i >= 0) d.documents[i] = clean; else d.documents.push(clean); });
      if (isNew) { isNew = false; history.replaceState(null, "", "#/docs/" + doc.id); }
    }
    function liveFull() { const cl = db.clients.find((c) => c.id === doc.clientId) || {}; return Object.assign({}, doc, { seller: db.settings.company, client: cl, totals: L.totals(doc) }); }
    function refresh(linesOnly) {
      const full = liveFull(), tt = full.totals;
      if (!linesOnly) {
        const cl = full.client;
        U.set(clientBox, cl.name ? h("div.row-s", { style: "margin-top:10px;line-height:1.6" }, [cl.type === "pro" ? "Professionnel" : "Particulier", [cl.address, cl.zip, cl.city].filter(Boolean).join(" "), cl.siren && "SIREN " + cl.siren, cl.vatNumber && "TVA " + cl.vatNumber].filter(Boolean).join(" · "), " ", h("a", { href: "#", style: "text-decoration:underline", onclick: (e) => { e.preventDefault(); HQ.clients.openSheet(cl.id, () => refresh()); } }, "modifier")) : null);
        f.vatOnDebits.closest("label").hidden = doc.vatRegime !== "normal";
      }
      linesBox.querySelectorAll(".line").forEach((el, i) => { if (el._ht && doc.lines[i]) el._ht.textContent = U.eur(L.lineHT(doc.lines[i])); });
      totalsBox.replaceChildren(h("div", h("span", "Total HT"), h("span", U.eur(tt.ht))), ...(doc.vatRegime === "normal" ? tt.byRate.map((r) => h("div.muted", h("span", `TVA ${String(r.rate).replace(".", ",")} %`), h("span", U.eur(r.vat)))) : [h("div.muted", h("span", L.vatMention(doc) || "—"), h("span", ""))]), h("div.grand", h("span", "Total TTC"), h("span", U.eur(tt.ttc))), ...(tt.deposits ? [h("div.muted", h("span", "Acomptes déduits"), h("span", "− " + U.eur(tt.deposits))), h("div.grand", h("span", "Net à payer"), h("span", U.eur(tt.due)))] : []));
      const res = L.validate(full, db.settings, db.documents, { today: U.today() });
      U.set(issuesBox, 
        res.errors.length ? h("div.issues", { role: "status" }, h("b", "À corriger avant d'émettre"), h("ul", res.errors.map((e) => h("li", e)))) : null,
        res.warnings.length ? h("div.issues.warn", h("b", "À vérifier"), h("ul", res.warnings.map((e) => h("li", e)))) : null,
        !res.errors.length ? h("div.banner", "Toutes les mentions obligatoires sont présentes : vous pouvez émettre.") : null);
    }
    async function startIssue() {
      save();
      const probe = liveFull(), res = L.validate(probe, db.settings, db.documents, { today: U.today() });
      if (res.errors.length) { U.toast("Corrigez les points signalés avant d'émettre.", "bad"); issuesBox.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      const gate = await HQ.sync.beforeIssue();
      if (!gate.ok) { U.toast(gate.message, "bad"); return; }
      const next = L.nextNumber(db.documents, doc, bl, doc.issueDate);
      const ok = await U.confirm({ title: `Émettre ${L.TYPE_LABEL[doc.type].toLowerCase()} ${next} ?`, text: `Client : ${probe.client.name} · Total : ${U.eur(probe.totals.ttc)} TTC. Une fois émise, la pièce reçoit son numéro définitif, elle est verrouillée (aucune modification possible : seule une facture d'avoir peut corriger) et conservée dans la chaîne d'intégrité.`, ok: "Émettre définitivement" });
      if (!ok) return;
      const r = await issueDoc(doc);
      if (!r.ok) { U.toast(r.errors[0], "bad"); return; }
      HQ.sync.afterIssue();
      U.toast(`${r.doc.number} émise`, "ok"); HQ.go("/docs/" + doc.id);
    }
    drawLines(); refresh();
    HQ.holdRefresh = true;
    return () => { HQ.holdRefresh = false; };
  }

  // ----- Viewer (issued document) -----
  function viewer(root, ctx, doc) {
    const db = store.db(), st = stateOf(doc, db), isQuote = doc.type === "quote", isCredit = doc.type === "credit";
    const cl = doc.client, pays = db.payments.filter((p) => p.docId === doc.id).sort((a, b) => a.date.localeCompare(b.date));
    const bal = isQuote || isCredit ? 0 : L.balance(doc, db.payments, db.documents);
    const rerender = ctx.rerender;

    const acts = [];
    acts.push(U.btn("Imprimer / PDF", { icon: "print", onClick: () => printDoc(doc, db) }));
    if (!isQuote && !isCredit && bal > 0) acts.push(U.btn("Enregistrer un paiement", { kind: "accent", icon: "euro", onClick: () => paymentSheet(doc, rerender) }));
    if (isQuote && ["sent", "expired"].includes(st)) acts.push(U.btn("Marquer accepté", { kind: "accent", icon: "check", onClick: () => { store.mutate((d) => { d.documents.find((x) => x.id === doc.id).status = "accepted"; store.audit("quote.accept", doc.number); }); rerender(); } }), U.btn("Refusé", { onClick: () => { store.mutate((d) => { d.documents.find((x) => x.id === doc.id).status = "declined"; store.audit("quote.decline", doc.number); }); rerender(); } }));
    if (isQuote && st !== "declined" && st !== "invoiced") acts.push(U.btn("Facture d'acompte", { icon: "euro", onClick: () => depositSheet(doc) }), U.btn("Créer la facture", { kind: st === "accepted" ? "accent" : "ghost", icon: "doc", onClick: () => HQ.go("/docs/new/invoice?from=" + doc.id) }));
    if (!isQuote && !isCredit && st !== "credited") acts.push(U.btn("Créer un avoir", { icon: "refresh", onClick: () => HQ.go("/docs/new/credit?from=" + doc.id) }));
    acts.push(U.btn("Dupliquer", { icon: "copy", onClick: () => HQ.go(`/docs/new/${doc.type === "deposit" ? "invoice" : doc.type}?dup=${doc.id}`) }));

    root.appendChild(h("div.page-head", h("div", h("a.back", { href: "#/docs" }, icon("chevL"), "Documents"), h("div.eyebrow", L.TYPE_LABEL[doc.type]), h("h1", { style: "display:flex;gap:14px;align-items:center;flex-wrap:wrap" }, doc.number, badge(st)))));
    root.appendChild(h("div.head-actions", { style: "margin-bottom:18px" }, acts));

    const sum = h("div.stack");
    sum.appendChild(h("div.card", h("h2", "Résumé"), h("dl.kv", kv("Client", cl.name), kv("Émission", U.fmtDate(doc.issueDate)), isQuote ? kv("Valable jusqu'au", U.fmtDate(doc.validUntil)) : isCredit ? kv("Facture d'origine", doc.refNumber) : kv("Échéance", U.fmtDate(doc.dueDate)), kv("Total HT", U.eur(doc.totals.ht)), doc.vatRegime === "normal" ? kv("TVA", U.eur(doc.totals.vat)) : null, kv("Total TTC", U.eur(doc.totals.ttc)), doc.totals.deposits ? kv("Net à payer", U.eur(doc.totals.due)) : null, !isQuote && !isCredit ? kv("Reste dû", U.eur(Math.max(0, bal))) : null)));
    if (!isQuote && !isCredit) {
      const credits = db.documents.filter((d) => d.type === "credit" && d.refId === doc.id);
      sum.appendChild(h("div.card", h("h2", "Paiements", h("small", `${pays.length}`)), pays.length ? h("div.list", pays.map((p) => h("div.row", { style: "cursor:default" }, h("div", h("div.row-t", U.eur(p.amount)), h("div.row-s", `${U.fmtDate(p.date)} · ${p.method}${p.note ? " · " + p.note : ""}`)), U.iconBtn("trash", "Supprimer ce paiement", async () => { if (await U.confirm({ title: "Supprimer ce paiement ?", text: `${U.eur(p.amount)} du ${U.fmtDate(p.date)}. L'action est tracée dans le journal.`, ok: "Supprimer", danger: true })) { store.mutate((d) => { d.payments = d.payments.filter((x) => x.id !== p.id); store.audit("payment.delete", `${doc.number} — ${U.eur(p.amount)}`); }); rerender(); } }, "danger")))) : h("div.empty", "Aucun paiement enregistré."),
        credits.length ? h("div.banner", { style: "margin-top:12px" }, "Avoirs liés : ", credits.map((c, i) => [i ? ", " : "", h("a", { href: "#/docs/" + c.id, style: "text-decoration:underline" }, c.number || "brouillon")])) : null));
    }
    sum.appendChild(h("div.card", h("h2", "Intégrité"), h("dl.kv", kv("Rang dans la chaîne", "#" + doc.chainIndex), kv("Émise le", U.fmtDateTime(doc.issuedAt))), h("p.mono.muted", { style: "font-size:.68rem;word-break:break-all;margin-top:10px" }, doc.hash), h("p.hint", { style: "margin-top:8px" }, "Pièce verrouillée : toute modification est détectée par la vérification d'intégrité (Conformité).")));
    const wrap = h("div.paper-wrap", { html: paperHTML(doc, db) });
    sum.style.minWidth = "0";
    const grid = h("div", { style: "display:grid;gap:14px;grid-template-columns:minmax(0,1fr)" }, sum, h("div", { style: "min-width:0" }, wrap));
    if (matchMedia("(min-width: 1180px)").matches) { grid.style.gridTemplateColumns = "340px minmax(0,1fr)"; grid.style.alignItems = "start"; }
    root.appendChild(grid);
    requestAnimationFrame(() => fitPaper(wrap));
    function kv(k, v) { return v == null ? null : [h("dt", k), h("dd", v)]; }
    function depositSheet(q) {
      const pct = U.input({ value: "30", inputmode: "numeric" });
      const s = U.sheet({ title: "Facture d'acompte", body: h("form.form", { onsubmit: (e) => { e.preventDefault(); s.close(true); HQ.go(`/docs/new/deposit?from=${q.id}&pct=${encodeURIComponent(pct.value)}`); } }, h("p.muted", `Devis ${q.number} — ${U.eur(q.totals.ttc)} TTC`), field("Pourcentage d'acompte (%)", pct, { req: true }), h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Créer le brouillon", { kind: "accent", type: "submit" }))) });
    }
  }
  HQ.docs = { paperHTML, viewOf, stateOf, badge, newDraft, issue: issueDoc };
})();
