// Unit tests for the invoicing rules. Run: node tools/test-legal.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const L = require("../hq-r7k29m/js/legal.js");

let n = 0;
const t = async (name, fn) => { try { await fn(); n++; console.log("  ok  ", name); } catch (e) { console.error("  FAIL", name, "\n", e.message); process.exitCode = 1; } };

const settings = () => ({
  company: { name: "Djason Nathiez", legalForm: "EI", address: "1 rue Test", zip: "59264", city: "Onnaing", siret: L.luhnComplete("44306184100047".slice(0, 13)), vatNumber: "", registration: "Dispensé d'immatriculation au RCS et au RM", iban: "FR7612345678901234567890123", capital: "", insurance: "", mediator: "" },
  billing: { vatRegime: "franchise", prefixInvoice: "FA", prefixQuote: "DE", prefixCredit: "AV", paymentMethods: "Virement bancaire", discountMention: "Pas d'escompte pour paiement anticipé.", recoveryFee: 4000, noteInvoice: "", noteQuote: "" },
});
const client = (o = {}) => ({ name: "Acme SAS", type: "pro", address: "2 av. Client", zip: "75001", city: "Paris", siren: L.luhnComplete("44306184"), ...o });
const mkDoc = (o = {}) => {
  const d = { id: "d" + Math.random(), type: "invoice", vatRegime: "franchise", issueDate: "2026-10-05", serviceDate: "2026-10-05", dueDate: "2026-11-04", category: "service", client: client(), lines: [{ desc: "Développement Unity", qty: 5, unit: 40000, discount: 0, vat: 0 }], ...o };
  d.totals = L.totals(d);
  return d;
};

console.log("legal.js");

await t("rounding is symmetric for credits", () => {
  assert.equal(L.lineHT({ qty: 0.5, unit: 125 }), 63);
  assert.equal(L.lineHT({ qty: -0.5, unit: 125 }), -63);
  assert.equal(L.lineHT({ qty: 3, unit: 3333, discount: 10 }), 8999);
});

await t("totals per VAT rate, franchise and reverse charge give 0 VAT", () => {
  const normal = { vatRegime: "normal", lines: [{ qty: 2, unit: 10000, vat: 20 }, { qty: 1, unit: 5000, vat: 10 }, { qty: 1, unit: 1000, vat: 20 }] };
  const tt = L.totals(normal);
  assert.equal(tt.ht, 26000);
  assert.deepEqual(tt.byRate.map((r) => [r.rate, r.ht, r.vat]), [[20, 21000, 4200], [10, 5000, 500]]);
  assert.equal(tt.vat, 4700); assert.equal(tt.ttc, 30700);
  assert.equal(L.totals({ ...normal, vatRegime: "franchise" }).vat, 0);
  assert.equal(L.totals({ ...normal, vatRegime: "autoliq" }).ttc, 26000);
});

await t("deposits reduce the amount due", () => {
  const d = { vatRegime: "franchise", lines: [{ qty: 1, unit: 100000 }], deposits: [{ ttc: 30000 }] };
  const tt = L.totals(d); assert.equal(tt.ttc, 100000); assert.equal(tt.due, 70000);
});

await t("SIREN / SIRET use the Luhn check", () => {
  assert.equal(L.validSiren("443 061 841"), true);
  assert.equal(L.validSiren("443061842"), false);
  assert.equal(L.validSiret(L.luhnComplete("4430618410004")), true);
  assert.equal(L.validSiret("12345"), false);
});

await t("numbering is continuous per series and restarts each year", () => {
  const b = settings().billing;
  const docs = [];
  const issue = (type, date) => { const d = mkDoc({ type, issueDate: date }); d.number = L.nextNumber(docs, d, b, date); d.chainIndex = docs.length + 1; docs.push(d); return d.number; };
  assert.equal(issue("invoice", "2026-01-10"), "FA-2026-0001");
  assert.equal(issue("deposit", "2026-02-10"), "FA-2026-0002"); // deposit invoices share the invoice series
  assert.equal(issue("quote", "2026-02-11"), "DE-2026-0001");
  assert.equal(issue("credit", "2026-03-01"), "AV-2026-0001");
  assert.equal(issue("invoice", "2027-01-02"), "FA-2027-0001");
  assert.deepEqual(L.sequenceGaps(docs), []);
  docs.splice(0, 1); // remove FA-2026-0001 -> FA-2026-0002 is now alone: a gap
  assert.equal(L.sequenceGaps(docs).length, 1);
});

await t("hash chain detects tampering", async () => {
  const docs = [];
  for (let i = 0; i < 3; i++) {
    const d = mkDoc({ issueDate: `2026-10-0${i + 1}` });
    d.number = `FA-2026-000${i + 1}`; d.chainIndex = i + 1;
    d.prevHash = i ? docs[i - 1].hash : ""; d.hash = await L.hashDoc(d, d.prevHash);
    docs.push(d);
  }
  assert.deepEqual(await L.verifyChain(docs), { ok: true, count: 3 });
  docs[1].lines[0].unit = 1; // tamper with an issued line
  const r = await L.verifyChain(docs);
  assert.equal(r.ok, false); assert.equal(r.brokenAt, "FA-2026-0002");
});

await t("a complete invoice passes validation", () => {
  const r = L.validate(mkDoc(), settings(), [], { today: "2026-10-06" });
  assert.deepEqual(r.errors, []);
});

await t("missing legal data is reported", () => {
  const s = settings(); s.company.siret = ""; s.company.address = "";
  const d = mkDoc({ client: client({ siren: "" }), serviceDate: "", dueDate: "", lines: [] });
  const r = L.validate(d, s, [], { today: "2026-10-06" });
  const text = r.errors.join(" | ");
  for (const k of ["SIRET", "adresse complète", "SIREN", "prestation", "échéance", "au moins une ligne"]) assert.match(text, new RegExp(k));
});

await t("VAT-liable seller needs a VAT number; reverse charge needs the client's", () => {
  const r1 = L.validate(mkDoc({ vatRegime: "normal" }), settings(), []); assert.match(r1.errors.join(), /TVA intracommunautaire/);
  const r2 = L.validate(mkDoc({ vatRegime: "autoliq" }), settings(), []); assert.match(r2.errors.join(), /Autoliquidation/);
});

await t("chronology of the series is enforced", () => {
  const prev = mkDoc({ issueDate: "2026-10-10" }); prev.number = "FA-2026-0001"; prev.chainIndex = 1;
  const r = L.validate(mkDoc({ issueDate: "2026-10-05" }), settings(), [prev], { today: "2026-10-12" });
  assert.match(r.errors.join(), /Chronologie/);
});

await t("credit notes need negative amounts and cannot exceed the invoice", () => {
  const inv = mkDoc(); inv.number = "FA-2026-0001"; inv.chainIndex = 1;
  const ok = mkDoc({ type: "credit", refId: inv.id, lines: [{ desc: "Annulation", qty: -1, unit: 100000 }], issueDate: "2026-10-06" });
  assert.deepEqual(L.validate(ok, settings(), [inv], { today: "2026-10-06" }).errors, []);
  const positive = mkDoc({ type: "credit", refId: inv.id, lines: [{ desc: "x", qty: 1, unit: 100 }], issueDate: "2026-10-06" });
  assert.match(L.validate(positive, settings(), [inv], { today: "2026-10-06" }).errors.join(), /négatifs/);
  const tooMuch = mkDoc({ type: "credit", refId: inv.id, lines: [{ desc: "x", qty: -1, unit: 300000 }], issueDate: "2026-10-06" });
  assert.match(L.validate(tooMuch, settings(), [inv], { today: "2026-10-06" }).errors.join(), /solde créditable/);
});

await t("invoice state: issued, partial, paid, overdue, credited", () => {
  const inv = mkDoc(); inv.number = "FA-2026-0001"; inv.chainIndex = 1; // 2000 €
  const st = (pay, docs = [inv], today = "2026-10-20") => L.invoiceState(inv, pay.map((a) => ({ docId: inv.id, amount: a })), docs, today);
  assert.equal(st([]), "issued");
  assert.equal(st([50000]), "partial");
  assert.equal(st([200000]), "paid");
  assert.equal(st([], [inv], "2026-12-01"), "overdue");
  const credit = mkDoc({ type: "credit", refId: inv.id, lines: [{ desc: "x", qty: -1, unit: 200000 }] }); credit.number = "AV-2026-0001";
  assert.equal(st([], [inv, credit], "2026-12-01"), "credited");
});

await t("mandatory mentions", () => {
  const s = settings();
  const franchise = L.mentions(mkDoc(), s.billing).join(" ");
  assert.match(franchise, /293 B du CGI/); assert.match(franchise, /trois fois le taux d'intérêt légal/); assert.match(franchise, /40,00/);
  const b2c = L.mentions(mkDoc({ client: client({ type: "individual" }) }), s.billing).join(" ");
  assert.doesNotMatch(b2c, /Indemnité forfaitaire/);
  const quote = L.mentions(mkDoc({ type: "quote", validUntil: "2026-11-05" }), s.billing).join(" ");
  assert.match(quote, /Bon pour accord/); assert.match(quote, /05\/11\/2026/);
});

await t("livre des recettes lists payments chronologically", () => {
  const inv = mkDoc(); inv.number = "FA-2026-0001";
  const db = { documents: [inv], payments: [{ docId: inv.id, date: "2026-11-03", amount: 100, method: "Virement" }, { docId: inv.id, date: "2026-10-03", amount: 200, method: "Virement" }, { docId: inv.id, date: "2025-10-03", amount: 5, method: "x" }] };
  const rows = L.livreRecettes(db, 2026);
  assert.equal(rows.length, 2); assert.equal(rows[0].date, "2026-10-03"); assert.equal(rows[0].ref, "FA-2026-0001");
});

console.log(`\n${n} test(s) passed`);
