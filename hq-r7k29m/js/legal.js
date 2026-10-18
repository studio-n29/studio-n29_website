/* N29 HQ — French invoicing rules: totals, VAT, numbering, hash chain, validation, mandatory mentions.
   Pure functions (no DOM) so they can be unit-tested in Node (tools/test-legal.mjs).
   Not legal advice: the rules encoded here follow the Code de commerce (L441-9, L441-10, D441-5),
   the CGI (art. 242 nonies A annexe II, 289, 293 B) and the e-invoicing reform mentions applying from 1 Sept 2026. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.HQ = root.HQ || {}).legal = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const L = {};
  const pad = (n, w) => String(n).padStart(w, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
  const eur = (c) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const fmtDate = (s) => (s ? s.split("-").reverse().join("/") : "");
  const roundHalfAway = (v) => Math.sign(v) * Math.round(Math.abs(v) + 1e-9);

  L.VAT_RATES = [20, 10, 5.5, 2.1, 0];
  L.LEGAL_FORMS = [["EI", "Entrepreneur individuel (EI / micro-entrepreneur)"], ["EURL", "EURL"], ["SASU", "SASU"], ["SARL", "SARL"], ["SAS", "SAS"], ["SA", "SA"], ["Autre", "Autre"]];
  L.PAYMENT_METHODS = ["Virement bancaire", "Carte bancaire", "Chèque", "Espèces", "PayPal", "Prélèvement", "Autre"];
  L.UNITS = ["jour", "heure", "forfait", "unité", "mois", "page", "mot"];

  // ---------- Identifiers ----------
  L.luhn = (digits) => {
    if (!/^\d+$/.test(digits)) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) { let n = +digits[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
    return sum % 10 === 0;
  };
  L.cleanId = (s) => String(s || "").replace(/\s/g, "");
  L.validSiren = (s) => { s = L.cleanId(s); return /^\d{9}$/.test(s) && L.luhn(s); };
  L.validSiret = (s) => { s = L.cleanId(s); return /^\d{14}$/.test(s) && (L.luhn(s) || s.startsWith("356000000")); };
  L.luhnComplete = (prefix) => { for (let d = 0; d < 10; d++) if (L.luhn(prefix + d)) return prefix + d; return prefix + "0"; };
  L.validFrVat = (s) => /^FR[0-9A-Z]{2}\d{9}$/i.test(L.cleanId(s));

  // ---------- Kinds / series ----------
  L.kindOf = (doc) => (doc.type === "quote" ? "quote" : doc.type === "credit" ? "credit" : "invoice"); // deposit invoices share the invoice series
  L.TYPE_LABEL = { quote: "Devis", invoice: "Facture", deposit: "Facture d'acompte", credit: "Avoir" };
  L.prefixFor = (doc, billing) => (L.kindOf(doc) === "quote" ? billing.prefixQuote : L.kindOf(doc) === "credit" ? billing.prefixCredit : billing.prefixInvoice);

  // ---------- Totals (integers = cents) ----------
  L.lineHT = (line) => {
    const q = Number(line.qty) || 0, u = Number(line.unit) || 0, d = Math.min(100, Math.max(0, Number(line.discount) || 0));
    return roundHalfAway(q * u * (1 - d / 100));
  };
  L.lineGross = (line) => roundHalfAway((Number(line.qty) || 0) * (Number(line.unit) || 0));
  L.rateOf = (doc, line) => (doc.vatRegime === "normal" ? Number(line.vat) || 0 : 0);
  L.totals = (doc) => {
    const by = new Map();
    let discount = 0;
    const lines = (doc.lines || []).map((l) => {
      const ht = L.lineHT(l), rate = L.rateOf(doc, l);
      discount += L.lineGross(l) - ht;
      by.set(rate, (by.get(rate) || 0) + ht);
      return { ht, rate };
    });
    const byRate = [...by.entries()].sort((a, b) => b[0] - a[0]).map(([rate, ht]) => ({ rate, ht, vat: roundHalfAway((ht * rate) / 100) }));
    const ht = byRate.reduce((s, r) => s + r.ht, 0), vat = byRate.reduce((s, r) => s + r.vat, 0);
    const deposits = (doc.deposits || []).reduce((s, d) => s + (Number(d.ttc) || 0), 0);
    return { lines, byRate, ht, vat, ttc: ht + vat, discount, deposits, due: ht + vat - deposits };
  };

  // ---------- Payments / state ----------
  L.paid = (doc, payments) => (payments || []).filter((p) => p.docId === doc.id).reduce((s, p) => s + p.amount, 0);
  L.credited = (doc, documents) => (documents || []).filter((d) => d.type === "credit" && d.refId === doc.id && d.number).reduce((s, d) => s - d.totals.ttc, 0); // credit totals are negative
  L.balance = (doc, payments, documents) => doc.totals.due - L.paid(doc, payments) - L.credited(doc, documents);
  L.invoiceState = (doc, payments, documents, today) => {
    if (!doc.number) return "draft";
    if (doc.type === "credit") return "issued";
    const bal = L.balance(doc, payments, documents);
    if (L.credited(doc, documents) >= doc.totals.ttc && doc.totals.ttc > 0) return "credited";
    if (bal <= 0) return "paid";
    if (doc.dueDate && doc.dueDate < today) return "overdue";
    return L.paid(doc, payments) > 0 ? "partial" : "issued";
  };
  L.quoteState = (doc, today) => {
    if (!doc.number) return "draft";
    if (doc.status === "accepted" || doc.status === "declined" || doc.status === "invoiced") return doc.status;
    return doc.validUntil && doc.validUntil < today ? "expired" : "sent";
  };

  // ---------- Numbering (continuous, chronological, per series and year) ----------
  const numRe = (prefix) => new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "-(\\d{4})-(\\d+)$");
  L.nextNumber = (documents, doc, billing, issueDate) => {
    const prefix = L.prefixFor(doc, billing), kind = L.kindOf(doc), year = issueDate.slice(0, 4), re = numRe(prefix);
    let max = 0;
    for (const d of documents) {
      if (!d.number || L.kindOf(d) !== kind) continue;
      const m = re.exec(d.number);
      if (m && m[1] === year) max = Math.max(max, +m[2]);
    }
    return `${prefix}-${year}-${pad(max + 1, 4)}`;
  };
  L.lastIssued = (documents, doc) => documents.filter((d) => d.number && L.kindOf(d) === L.kindOf(doc)).sort((a, b) => (a.chainIndex || 0) - (b.chainIndex || 0)).pop() || null;
  L.sequenceGaps = (documents) => {
    const out = [];
    for (const kind of ["quote", "invoice", "credit"]) {
      const groups = new Map();
      for (const d of documents) {
        if (!d.number || L.kindOf(d) !== kind) continue;
        const m = /^(.+)-(\d{4})-(\d+)$/.exec(d.number); if (!m) continue;
        const k = m[1] + "-" + m[2]; if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(+m[3]);
      }
      for (const [k, arr] of groups) { arr.sort((a, b) => a - b); for (let i = 0; i < arr.length; i++) if (arr[i] !== i + 1) { out.push(`${k}: numéro ${pad(i + 1, 4)} manquant`); break; } }
    }
    return out;
  };

  // ---------- Hash chain (tamper evidence) ----------
  const canon = (v) => (v === null || typeof v !== "object" ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}");
  L.canonical = canon;
  const sha256 = async (text) => { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(b)].map((x) => pad(x.toString(16), 2)).join(""); };
  L.sha256 = sha256;
  L.hashContent = (doc) => ({ type: doc.type, number: doc.number, issueDate: doc.issueDate, serviceDate: doc.serviceDate, dueDate: doc.dueDate, validUntil: doc.validUntil, seller: doc.seller, client: doc.client, lines: doc.lines, vatRegime: doc.vatRegime, totals: doc.totals, deposits: doc.deposits || [], refNumber: doc.refNumber || "", refDate: doc.refDate || "", notes: doc.notes || "", category: doc.category, vatOnDebits: !!doc.vatOnDebits, paymentMethods: doc.paymentMethods || "", mentions: doc.mentions || [] });
  L.hashDoc = (doc, prevHash) => sha256(canon(L.hashContent(doc)) + "|" + (prevHash || ""));
  L.verifyChain = async (documents) => {
    const issued = documents.filter((d) => d.number).sort((a, b) => a.chainIndex - b.chainIndex);
    let prev = "";
    for (let i = 0; i < issued.length; i++) {
      const d = issued[i];
      if (d.prevHash !== prev || d.chainIndex !== i + 1 || (await L.hashDoc(d, prev)) !== d.hash) return { ok: false, count: issued.length, brokenAt: d.number };
      prev = d.hash;
    }
    return { ok: true, count: issued.length };
  };

  // ---------- Mandatory mentions ----------
  L.sellerLabel = (s) => (s.legalForm === "EI" ? `${s.name} — EI` : s.name);
  L.vatMention = (doc) => (doc.vatRegime === "franchise" ? "TVA non applicable, art. 293 B du CGI." : doc.vatRegime === "autoliq" ? "Autoliquidation de la TVA : TVA due par le preneur (art. 283-2 du CGI)." : "");
  L.mentions = (doc, billing) => {
    const out = [], s = doc.seller || {}, c = doc.client || {};
    const vm = L.vatMention(doc); if (vm) out.push(vm);
    if (doc.type === "quote") {
      if (doc.validUntil) out.push(`Devis valable jusqu'au ${fmtDate(doc.validUntil)}.`);
      out.push("Devis établi avant exécution de la prestation. Bon pour accord : date, signature précédée de la mention manuscrite « Bon pour accord ».");
    } else {
      if (doc.type === "credit" && doc.refNumber) out.push(`Avoir relatif à la facture n° ${doc.refNumber}${doc.refDate ? " du " + fmtDate(doc.refDate) : ""}.`);
      if (doc.type === "deposit" && doc.refNumber) out.push(`Facture d'acompte relative au devis n° ${doc.refNumber}.`);
      if (doc.type !== "credit") {
        if (doc.dueDate) out.push(`Date limite de règlement : ${fmtDate(doc.dueDate)}.${doc.paymentMethods ? " Mode de règlement : " + doc.paymentMethods + "." : ""}`);
        out.push("Pénalités de retard : trois fois le taux d'intérêt légal, exigibles sans rappel dès le lendemain de la date d'échéance (art. L441-10 du Code de commerce).");
        if (c.type !== "individual") out.push(`Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : ${eur((billing && billing.recoveryFee) || 4000)} (art. L441-10 et D441-5 du Code de commerce).`);
        if (billing && billing.discountMention) out.push(billing.discountMention);
      }
      if (doc.vatOnDebits && doc.vatRegime === "normal") out.push("Option pour le paiement de la TVA d'après les débits.");
    }
    if (s.registration) out.push(s.registration + (/\.$/.test(s.registration) ? "" : "."));
    if (s.legalForm && s.legalForm !== "EI" && s.capital) out.push(`${s.legalForm} au capital de ${s.capital}.`);
    if (s.insurance) out.push(s.insurance + (/\.$/.test(s.insurance) ? "" : "."));
    if (c.type === "individual" && s.mediator) out.push("Médiateur de la consommation : " + s.mediator + (/\.$/.test(s.mediator) ? "" : "."));
    const note = doc.type === "quote" ? billing && billing.noteQuote : billing && billing.noteInvoice;
    if (note) out.push(note);
    return out;
  };

  // ---------- Validation before issuing ----------
  L.validate = (doc, settings, documents, ctx = {}) => {
    const errors = [], warnings = [];
    const co = settings.company, bl = settings.billing, c = doc.client || {};
    const today = ctx.today || iso(new Date());
    const isInvoice = doc.type !== "quote";
    // Seller
    if (!co.name) errors.push("Vendeur : nom ou raison sociale manquant (Réglages ▸ Entreprise).");
    if (!co.address || !co.zip || !co.city) errors.push("Vendeur : adresse complète manquante (Réglages ▸ Entreprise).");
    if (!co.siret) errors.push("Vendeur : numéro SIRET manquant (Réglages ▸ Entreprise).");
    else if (!L.validSiret(co.siret)) errors.push("Vendeur : numéro SIRET invalide (14 chiffres).");
    if (doc.vatRegime === "normal" && !co.vatNumber) errors.push("Vendeur : numéro de TVA intracommunautaire requis lorsque la TVA est appliquée.");
    if (co.legalForm !== "EI" && !co.capital) warnings.push("Société : indiquez le capital social (mention obligatoire).");
    if (isInvoice && !co.iban) warnings.push("Aucun IBAN renseigné : le client ne saura pas où payer.");
    // Client
    if (!c.name) errors.push("Client : sélectionnez un client.");
    else {
      if (!c.address || !c.zip || !c.city) errors.push("Client : adresse complète manquante.");
      if (c.type === "pro") {
        if (!c.siren) (isInvoice ? errors : warnings).push("Client professionnel : numéro SIREN manquant (obligatoire sur les factures B2B depuis le 1er septembre 2026).");
        else if (!L.validSiren(c.siren)) errors.push("Client : numéro SIREN invalide (9 chiffres).");
      }
      if (doc.vatRegime === "autoliq" && !c.vatNumber) errors.push("Autoliquidation : numéro de TVA du client requis.");
    }
    // Document
    if (!doc.issueDate) errors.push("Date d'émission manquante.");
    else if (doc.issueDate > today) warnings.push("La date d'émission est dans le futur.");
    if (doc.type === "quote") {
      if (!doc.validUntil) errors.push("Durée de validité du devis manquante.");
      else if (doc.issueDate && doc.validUntil < doc.issueDate) errors.push("La validité du devis précède sa date d'émission.");
    } else if (doc.type !== "credit") {
      if (!doc.dueDate) errors.push("Date d'échéance manquante.");
      else if (doc.issueDate && doc.dueDate < doc.issueDate) errors.push("L'échéance précède la date d'émission.");
      else if (doc.issueDate && L.diffDays(doc.dueDate, doc.issueDate) > 60) warnings.push("Délai de paiement supérieur à 60 jours : plafond légal (art. L441-10) — 45 jours fin de mois ou 60 jours date de facture.");
    }
    if (isInvoice && !doc.serviceDate) errors.push("Date (ou période) de la prestation manquante.");
    if (isInvoice && !doc.category) errors.push("Catégorie d'opération manquante (prestation de services, livraison de biens ou mixte).");
    const lines = doc.lines || [];
    if (!lines.length) errors.push("Ajoutez au moins une ligne.");
    lines.forEach((l, i) => {
      if (!String(l.desc || "").trim()) errors.push(`Ligne ${i + 1} : désignation manquante.`);
      if (!(Number(l.qty) !== 0)) errors.push(`Ligne ${i + 1} : quantité nulle.`);
      if (doc.type === "credit" ? (Number(l.qty) || 0) > 0 && (Number(l.unit) || 0) > 0 : (Number(l.qty) || 0) < 0 || (Number(l.unit) || 0) < 0) {
        errors.push(doc.type === "credit" ? `Ligne ${i + 1} : un avoir doit comporter des montants négatifs.` : `Ligne ${i + 1} : montant négatif (utilisez un avoir pour corriger).`);
      }
      if (doc.vatRegime === "normal" && !L.VAT_RATES.includes(Number(l.vat))) warnings.push(`Ligne ${i + 1} : taux de TVA inhabituel.`);
    });
    const tot = L.totals(doc);
    if (doc.type !== "credit" && tot.ttc <= 0 && lines.length) warnings.push("Le total de la facture est nul ou négatif.");
    // Credit note against its invoice
    if (doc.type === "credit") {
      const inv = documents.find((d) => d.id === doc.refId);
      if (!inv || !inv.number) errors.push("Avoir : la facture d'origine est introuvable ou non émise.");
      else if (-tot.ttc > inv.totals.ttc - L.credited(inv, documents)) errors.push("Avoir : montant supérieur au solde créditable de la facture.");
    }
    // Chronology of the series
    if (doc.issueDate) {
      const last = L.lastIssued(documents.filter((d) => d.id !== doc.id), doc);
      if (last && last.issueDate > doc.issueDate) errors.push(`Chronologie : la dernière pièce de la série (${last.number}) est datée du ${fmtDate(last.issueDate)} ; la numérotation doit rester chronologique.`);
    }
    return { errors, warnings };
  };
  L.diffDays = (a, b) => { const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(a) - p(b)) / 86400000); };

  // ---------- Livre des recettes (micro-entrepreneur obligation) ----------
  L.livreRecettes = (db, year) => db.payments
    .filter((p) => p.date.startsWith(String(year)))
    .map((p) => { const d = db.documents.find((x) => x.id === p.docId); return { date: p.date, ref: d ? d.number : "", client: d ? d.client.name : "", nature: d ? (d.lines[0] ? d.lines[0].desc : "") : "", method: p.method, amount: p.amount }; })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return L;
});
