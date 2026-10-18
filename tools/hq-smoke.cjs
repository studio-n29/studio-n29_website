// End-to-end smoke test of the private HQ app (real Chrome via puppeteer-core).
// Run: npm i --no-save puppeteer-core && node tools/hq-smoke.cjs   (serve the repo first: npx http-server -p 4173 -c-1 .)
// Optional: CHROME=/path/to/chrome  HQ_BASE=http://localhost:4173/hq-r7k29m/
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HQ_BASE || "http://localhost:4173/hq-r7k29m/";
const OUT = path.join(require("os").tmpdir(), "hq-smoke");
fs.mkdirSync(OUT, { recursive: true });
const PASS = "phrase de test numero un";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const ok = (c, msg) => { console.log(c ? "  ok  " : "  FAIL", msg); if (!c) failures++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/OperationError/.test(m.text())) errors.push("CONSOLE " + m.text()); });
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("favicon")) errors.push("HTTP " + r.status() + " " + r.url()); });
  page.on("dialog", (d) => d.dismiss());

  const clickText = async (sel, text) => {
    const h = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t) && !e.closest("[hidden]")), sel, text);
    const el = h.asElement(); if (!el) throw new Error(`no ${sel} with "${text}"`);
    await el.click(); await sleep(250);
  };
  const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await sleep(500); };
  const shot = async (name) => { await sleep(400); await page.screenshot({ path: path.join(OUT, name + ".png") }); };

  console.log("lock screen");
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.waitForSelector(".lock-card");
  ok(!!(await page.$("#ack")), "first run shows the create-vault screen");
  const pw = await page.$$("input[type=password]");
  await pw[0].type(PASS); await pw[1].type(PASS); await page.click("#ack");
  await page.click("button[type=submit]");
  await page.waitForSelector(".shell", { timeout: 15000 });
  ok(true, "vault created, shell displayed");

  console.log("demo data");
  await go("/settings?tab=data");
  await clickText("button", "Charger les données de démonstration");
  await clickText(".sheet button", "Charger");
  await page.waitForFunction(() => HQ.store.db().documents.length >= 8, { timeout: 20000 });
  await sleep(800);
  const counts = await page.evaluate(() => { const d = HQ.store.db(); return { docs: d.documents.length, issued: d.documents.filter((x) => x.number).length, clients: d.clients.length, tasks: d.tasks.length, pay: d.payments.length }; });
  ok(counts.docs === 8 && counts.issued === 7, `demo documents: ${JSON.stringify(counts)}`);
  const chain = await page.evaluate(async () => HQ.legal.verifyChain(HQ.store.db().documents));
  ok(chain.ok && chain.count === 7, "hash chain valid after demo issue " + JSON.stringify(chain));
  const gaps = await page.evaluate(() => HQ.legal.sequenceGaps(HQ.store.db().documents));
  ok(gaps.length === 0, "no numbering gap");

  console.log("manual invoice through the UI");
  await go("/docs/new/invoice");
  await page.waitForSelector(".line");
  const clientId = await page.evaluate(() => HQ.store.db().clients[1].id);
  await page.select("select", clientId);
  await sleep(200);
  await page.evaluate(() => { const t = document.querySelector(".line textarea"); t.value = "Test UI — développement"; t.dispatchEvent(new Event("input", { bubbles: true })); });
  const inputs = await page.$$(".line input");
  await inputs[1].click({ clickCount: 3 }); await inputs[1].type("450"); // unit price
  await sleep(300);
  const totalText = await page.$eval(".totals .grand", (e) => e.textContent);
  ok(/450,00/.test(totalText), "live total updates: " + totalText.replace(/\s+/g, " "));
  const issues = await page.$$eval(".issues", (e) => e.length);
  ok(issues === 0, "no blocking validation issue on a complete invoice");
  await clickText("button", "Émettre la facture");
  await page.waitForSelector(".sheet");
  await clickText(".sheet button", "Émettre définitivement");
  await page.waitForFunction(() => /^#\/docs\/[\w-]+$/.test(location.hash) && document.querySelector(".paper"), { timeout: 10000 });
  const num = await page.$eval("h1", (e) => e.textContent);
  ok(/FA-\d{4}-0005/.test(num), "invoice issued with next continuous number: " + num.trim());
  const chain2 = await page.evaluate(async () => HQ.legal.verifyChain(HQ.store.db().documents));
  ok(chain2.ok && chain2.count === 8, "chain valid after UI issue");
  await clickText("button", "Enregistrer un paiement");
  await page.waitForSelector(".sheet");
  await clickText(".sheet button", "Enregistrer");
  await sleep(500);
  const st = await page.evaluate(() => { const d = HQ.store.db(); const inv = d.documents.find((x) => x.number && /0005/.test(x.number) && x.type === "invoice"); return HQ.legal.invoiceState(inv, d.payments, d.documents, HQ.util.today()); });
  ok(st === "paid", "payment of the full balance marks the invoice paid (" + st + ")");

  console.log("issued documents are locked");
  const locked = await page.evaluate(() => { const d = HQ.store.db(); const inv = d.documents.find((x) => x.number); return !!inv.hash && inv.status !== "draft"; });
  ok(locked, "issued document carries hash and status");
  await go("/docs/" + (await page.evaluate(() => HQ.store.db().documents.find((x) => x.number).id)));
  await page.waitForSelector(".paper");
  ok(!(await page.$("form")) , "viewer of an issued document has no edit form");

  console.log("tampering is detected");
  const tamper = await page.evaluate(async () => { const d = HQ.store.db(); const doc = d.documents.find((x) => x.number); const keep = doc.lines[0].unit; doc.lines[0].unit = keep + 1; const r = await HQ.legal.verifyChain(d.documents); doc.lines[0].unit = keep; return r; });
  ok(tamper.ok === false, "modified line breaks the chain at " + tamper.brokenAt);

  console.log("lock / unlock");
  await clickText(".side button", "Verrouiller");
  await page.waitForSelector(".lock-card");
  ok(!(await page.$("#ack")), "lock screen asks for the passphrase");
  await page.type("input[type=password]", "mauvaise phrase");
  await page.click("button[type=submit]"); await sleep(1500);
  ok((await page.$eval(".err", (e) => e.textContent)).includes("incorrecte"), "wrong passphrase rejected");
  await page.$eval("input[type=password]", (e) => { e.value = ""; });
  await page.type("input[type=password]", PASS); await page.click("button[type=submit]");
  await page.waitForSelector(".shell", { timeout: 15000 });
  ok(true, "unlocked with the right passphrase; data persisted");
  ok((await page.evaluate(() => HQ.store.db().documents.length)) === 9, "all 9 documents survived lock/unlock");

  console.log("encrypted backup round trip");
  const bk = await page.evaluate(async () => { const txt = await HQ.store.exportEncrypted(); const plain = txt.includes("Pixel Forge"); await HQ.store.wipe(); const t = await HQ.store.importBackup(txt, "phrase de test numero un"); return { plain, type: t, docs: HQ.store.db().documents.length }; });
  ok(!bk.plain, "encrypted backup contains no readable client name");
  ok(bk.type === "encrypted" && bk.docs === 9, "restore from encrypted backup: " + JSON.stringify(bk));

  console.log("time tracking");
  await go("/time"); await page.waitForSelector(".timer");
  const before = await page.evaluate(() => HQ.store.db().timeEntries.length);
  await clickText("button", "Saisir du temps"); await page.waitForSelector(".sheet");
  const projId = await page.evaluate(() => HQ.store.db().projects[0].id);
  await page.evaluate((pid) => { const q = (s) => document.querySelector(".sheet " + s); const set = (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }; set(q("input[placeholder^=Sur]"), "Test calendrier"); set(q("select"), pid); set(q("input[placeholder^=\"1h30\"]"), "1h30"); }, projId);
  await sleep(200);
  ok((await page.$eval(".sheet .hint", (e) => e.textContent)).includes("1 h 30"), "duration text is understood live");
  await clickText(".sheet button", "Enregistrer"); await sleep(400);
  const mid = await page.evaluate(() => { const d = HQ.store.db(); const e = d.timeEntries[d.timeEntries.length - 1]; return { n: d.timeEntries.length, min: e.minutes, desc: e.description }; });
  ok(mid.n === before + 1 && mid.min === 90 && mid.desc === "Test calendrier", "entry saved from the sheet " + JSON.stringify(mid));
  ok((await page.$$eval(".cal .day", (e) => e.length)) >= 28, "month calendar rendered");
  await clickText(".seg button", "Semaine"); await sleep(300);
  ok((await page.$$eval(".wday", (e) => e.length)) === 7, "week view shows 7 days");
  await clickText(".seg button", "Mois");
  await clickText("button", "Démarrer"); await sleep(1300);
  ok(await page.evaluate(() => !!HQ.store.db().timer), "timer started");
  ok(/0:00:0[1-9]/.test(await page.$eval(".timer-clock", (e) => e.textContent)), "timer clock ticks");
  await clickText("button", "Arrêter"); await sleep(400);
  const after = await page.evaluate(() => { const d = HQ.store.db(); return { n: d.timeEntries.length, timer: d.timer }; });
  ok(after.n === before + 2 && after.timer === null, "timer stop creates an entry");
  await clickText(".tabs-inline button", "Rapport"); await page.waitForSelector(".stat");
  const rtxt = await page.$eval("main", (m) => m.innerText);
  ok(/temps total/i.test(rtxt) && /répartition/i.test(rtxt) && !/(^|\s)(null|undefined|NaN)(\s|$)/.test(rtxt), "report renders totals and breakdown");
  const rep = await page.evaluate(() => { const d = HQ.store.db(); const c = { projects: d.projects, tasks: d.tasks, clients: d.clients, billing: d.settings.billing }; const r = HQ.timeutil.rangeFor("month", HQ.util.today()); const es = HQ.timeutil.filter(d.timeEntries, r, d.documents); return HQ.timeutil.summary(es, c); });
  ok(rep.minutes >= 90, "report data matches the entries: " + JSON.stringify(rep));
  await clickText("button", "Facturer"); await page.waitForSelector(".sheet");
  await page.select(".sheet select", await page.evaluate(() => HQ.store.db().clients[0].id));
  await clickText(".sheet button", "Créer le brouillon");
  await page.waitForFunction(() => location.hash.startsWith("#/docs/") && !location.hash.includes("new") && document.querySelector(".line"), { timeout: 8000 });
  const inv = await page.evaluate(() => { const d = HQ.store.db(); const doc = d.documents.find((x) => x.timeEntryIds); return { lines: doc.lines.length, unit: doc.lines[0].unit, label: doc.lines[0].unitLabel, billed: d.timeEntries.filter((e) => e.docId === doc.id).length, n: doc.timeEntryIds.length }; });
  ok(inv.lines >= 1 && inv.label === "heure" && inv.billed === inv.n && inv.n > 0, "invoice draft created from hours " + JSON.stringify(inv));
  const stillTodo = await page.evaluate(() => { const d = HQ.store.db(); const T = HQ.timeutil; return T.filter(d.timeEntries, { billed: "todo" }, d.documents).filter((e) => d.documents.some((x) => x.timeEntryIds && x.timeEntryIds.includes(e.id))).length; });
  ok(stillTodo === 0, "invoiced hours are no longer offered for billing");

  console.log("route sweep");
  for (const r of ["/time", "/settings?tab=billing", "/settings?tab=security", "/settings?tab=data", "/", "/projects", "/docs", "/clients", "/tools", "/tools/apex", "/compliance", "/settings", "/more"]) { await go(r); await sleep(300); const txt = await page.$eval("main", (m) => m.innerText); ok(txt.trim().length > 20 && !/(^|s)(null|undefined|NaN)(s|$)/.test(txt), "route renders without stray null/undefined/NaN: " + r); }
  await go("/tools/apex");
  for (const t of ["Créatures", "Paysage", "Carte", "Style commun", "Bibliothèque", "Personnage"]) await clickText(".tabs-inline button", t);
  await clickText("button", "Au hasard");
  const prompt = await page.$eval(".gen:not([hidden]) .out", (e) => e.textContent);
  ok(prompt.length > 80, "apex generates a prompt (" + prompt.length + " chars)");

  console.log(errors.length ? "\nERRORS:\n" + [...new Set(errors)].join("\n") : "\nno console errors");
  await browser.close();
  process.exitCode = failures || errors.length ? 1 : 0;
  console.log(failures ? failures + " failure(s)" : "all checks passed");
})().catch((e) => { console.error(e); process.exit(1); });
