// End-to-end test of document folders and of importing folders, PDF and spreadsheets (real Chrome).
// Run: node tools/hq-files.cjs   (serve the repo first: npx http-server -p 4173 -c-1 .)
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const os = require("os");
const path = require("path");
const BASE = process.env.HQ_BASE || "http://localhost:4173/hq-r7k29m/";
const PASS = "phrase de test numero un";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const ok = (c, msg, extra) => { console.log(c ? "  ok  " : "  FAIL", msg, c ? "" : "\n      " + extra); if (!c) failures++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/OperationError|Failed to load resource/.test(m.text())) errors.push("CONSOLE " + m.text()); });
  page.on("dialog", (d) => d.dismiss());
  const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await sleep(600); };
  const clickText = async (sel, text) => {
    const h = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t) && !e.closest("[hidden]")), sel, text);
    const el = h.asElement(); if (!el) throw new Error(`no ${sel} with "${text}"`);
    await el.click(); await sleep(300);
  };
  const db = () => page.evaluate(() => JSON.parse(JSON.stringify(HQ.store.db(), (k, v) => (k === "audit" ? undefined : v))));

  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.waitForSelector(".lock-card");
  const pw = await page.$$("input[type=password]");
  await pw[0].type(PASS); await pw[1].type(PASS); await page.click("#ack"); await page.click("button[type=submit]");
  await page.waitForSelector(".shell", { timeout: 15000 });
  await page.evaluate(() => HQ.store.mutate((d) => { d.projects.push({ id: "p1", name: "Projet A", color: "#8a5cff", status: "active", clientId: "", description: "", url: "", deadline: "", createdAt: 1 }); }));

  console.log("folders");
  await go("/projects?tab=docs&p=p1");
  await clickText(".toolbar .btn", "Dossier");
  await page.waitForSelector(".sheet form"); await page.type(".sheet input[type=text]", "Design"); await clickText(".sheet button", "Créer");
  let d = await db();
  ok(d.folders.length === 1 && d.folders[0].name === "Design" && d.folders[0].projectId === "p1", "a folder is created in the project");
  ok(await page.evaluate(() => !document.querySelector(".crumbs").hidden && /Design/.test(document.querySelector(".crumbs").innerText)), "the new folder is opened with a breadcrumb");
  await clickText(".toolbar .btn", "Dossier");
  await page.waitForSelector(".sheet form"); await page.type(".sheet input[type=text]", "Niveaux"); await clickText(".sheet button", "Créer");
  d = await db();
  ok(d.folders.length === 2 && d.folders[1].parentId === d.folders[0].id, "sub-folders nest inside the current folder");
  await clickText(".sheet, .toolbar .btn", "Document").catch(() => {});
  await page.evaluate(() => { location.hash = "/projects?tab=docs&p=p1"; }); await sleep(500);
  await clickText(".toolbar .btn", "Document"); await page.waitForSelector(".sheet form");
  await page.type(".sheet input[type=text]", "Doc en dossier"); await clickText(".sheet button", "Créer"); await page.waitForSelector(".rte");
  d = await db();
  ok(d.notes[0].folderId === d.folders[1].id || d.notes[0].folderId === d.folders[0].id, "a document created inside a folder is stored in it");
  const noteId = d.notes[0].id, rootFolder = d.folders[0].id, subFolder = d.folders[1].id;

  console.log("move");
  await go("/projects?tab=docs&p=p1");
  await page.evaluate((id) => HQ.store.mutate((x) => { x.notes.find((n) => n.id === id).folderId = ""; }), noteId); await go("/projects?tab=docs&p=p1");
  await page.evaluate(() => { document.querySelector(".row--doc .icon-btn").click(); }); await page.waitForSelector(".sheet select");
  await page.select(".sheet select", rootFolder); await clickText(".sheet button", "Déplacer"); await sleep(400);
  d = await db();
  ok(d.notes[0].folderId === rootFolder, "a document can be moved into a folder");

  console.log("import a whole folder (files with relative paths)");
  const rep = await page.evaluate(async () => {
    const IMP = HQ.importer; const X = await IMP.loadSheets();
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([["Héros", "PV", "Notes"], ["Rayner", 1200, "tank | fort"], ["Mira", 800, ""]]), "Stats"); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([["Objet", "Prix"], ["Épée", 10]]), "Objets");
    const xlsx = new File([X.write(wb, { type: "array", bookType: "xlsx" })], "stats.xlsx");
    const stream = "BT /F1 24 Tf 20 100 Td (Hello PDF) Tj ET";
    const pdf = new File([`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF`], "guide.pdf", { type: "application/pdf" });
    const md1 = new File(["# Lisez-moi\n\nBonjour **monde**.\n"], "readme.md"), md2 = new File(["Note sans titre"], "spec.txt");
    const entries = [["Projet/readme.md", md1], ["Projet/docs/spec.txt", md2], ["Projet/data/stats.xlsx", xlsx], ["Projet/files/guide.pdf", pdf], ["Projet/logo.png", new File(["x"], "logo.png")], ["Projet/.hidden/secret.md", new File(["s"], "secret.md")], ["Projet/~$lock.xlsx", new File(["s"], "~$lock.xlsx")]].map(([p, f]) => ({ file: f, path: p }));
    const r = await IMP.run(entries, { projectId: "p1", folderId: "" });
    return { notes: r.notes, folders: r.folders, md: r.md, sheets: r.sheets, pdf: r.pdf, skipped: r.skipped, failed: r.failed, notes2: r.notes2, hidden: r.skippedHidden };
  });
  console.log("      report:", JSON.stringify(rep));
  ok(rep.notes === 4 && rep.md === 2 && rep.sheets === 1 && rep.pdf === 1 && rep.failed.length === 0, "markdown, text, spreadsheet and PDF are imported", JSON.stringify(rep));
  ok(rep.skipped.length === 1 && rep.skipped[0].endsWith("logo.png") && rep.hidden === 2, "unsupported files are reported and hidden/temporary files are ignored", JSON.stringify(rep));
  d = await db();
  const byName = (n) => d.folders.find((f) => f.name === n);
  ok(byName("Projet") && byName("docs") && byName("data") && byName("files") && byName("docs").parentId === byName("Projet").id, "the folder tree is recreated with its sub-folders");
  const sheet = d.notes.find((n) => n.kind === "sheet"), pdf = d.notes.find((n) => n.kind === "pdf"), readme = d.notes.find((n) => n.title === "Lisez-moi");
  ok(sheet && sheet.folderId === byName("data").id && /## Stats/.test(sheet.md) && /\| Héros \| PV \| Notes \|/.test(sheet.md) && /\| Rayner \| 1200 \| tank \\\| fort \|/.test(sheet.md) && /## Objets/.test(sheet.md), "each spreadsheet sheet becomes a Markdown table (pipes escaped)", sheet && sheet.md);
  ok(pdf && pdf.folderId === byName("files").id && pdf.pages === 1 && /Hello PDF/.test(pdf.text), "the PDF is stored with its page count and extracted text", JSON.stringify(pdf));
  ok(readme && readme.folderId === byName("Projet").id && readme.md.includes("**monde**"), "a Markdown file keeps its content and its folder");
  ok(await page.evaluate(async (a, b) => !!(await HQ.files.get(a)) && !!(await HQ.files.get(b)), sheet.id, pdf.id), "originals are kept on the device");

  console.log("browse");
  await page.evaluate(() => sessionStorage.removeItem("n29hq.folder")); await go("/"); await go("/projects?tab=docs&p=p1");
  await page.evaluate(() => [...document.querySelectorAll(".row--folder .row-main")].find((b) => /Projet/.test(b.textContent)).click()); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll(".row--folder .row-main")].find((b) => /files/.test(b.textContent)).click()); await sleep(300);
  ok(await page.evaluate(() => /Projet/.test(document.querySelector(".crumbs").innerText) && /guide/.test(document.body.innerText) && /PDF/.test(document.querySelector(".row--doc").innerText)), "navigating folders shows the PDF with its badge and a breadcrumb");
  await page.evaluate(() => [...document.querySelectorAll(".crumbs button")].find((b) => /Racine/.test(b.textContent)).click()); await sleep(300);
  await page.evaluate(() => { const i = [...document.querySelectorAll(".toolbar input[type=search]")].find((x) => x.offsetParent); i.value = "hello"; i.dispatchEvent(new Event("input")); }); await sleep(400);
  ok(await page.evaluate(() => /guide/.test(document.querySelector(".dropzone").innerText)), "search looks inside PDF text across folders");
  await page.evaluate(() => { const i = [...document.querySelectorAll(".toolbar input[type=search]")].find((x) => x.offsetParent); i.value = ""; i.dispatchEvent(new Event("input")); });

  console.log("PDF viewer");
  await go("/projects/doc/" + pdf.id);
  await page.waitForSelector(".pdf-page canvas", { timeout: 15000 });
  await sleep(500);
  const painted = await page.evaluate(() => { const c = document.querySelector(".pdf-page canvas"), x = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < x.length; i += 4) if (x[i] < 128) return true; return false; });
  ok(painted, "the PDF page is rendered on a canvas (dark text pixels found)");
  ok(await page.evaluate(() => /Télécharger/.test(document.body.innerText) && /Remplacer/.test(document.body.innerText)), "the viewer offers download and replace");

  console.log("spreadsheet document");
  await go("/projects/doc/" + sheet.id); await page.waitForSelector(".rte");
  ok(await page.evaluate(() => document.querySelectorAll(".rte table").length === 2 && /Original/.test(document.body.innerText)), "the spreadsheet opens as editable tables with a button to get the original");

  console.log("real file input");
  const tmp = path.join(os.tmpdir(), "hq-import-test"); fs.mkdirSync(tmp, { recursive: true }); fs.writeFileSync(path.join(tmp, "depuis-disque.md"), "# Depuis le disque\n\nok\n");
  await go("/projects?tab=docs&p=p1");
  await clickText(".toolbar .btn", "Importer"); await page.waitForSelector(".sheet input[type=file]");
  const inputs = await page.$$(".sheet input[type=file]"); await inputs[0].uploadFile(path.join(tmp, "depuis-disque.md")); await sleep(1200);
  d = await db();
  ok(d.notes.some((n) => n.title === "Depuis le disque"), "files chosen through the picker are imported");

  console.log("delete a folder");
  await page.evaluate(() => sessionStorage.removeItem("n29hq.folder")); await go("/"); await go("/projects?tab=docs&p=p1");
  const before = (await db()).notes.length;
  await page.evaluate(() => { const r = [...document.querySelectorAll(".row--folder")].find((x) => /Design/.test(x.innerText)); r.querySelector(".icon-btn.danger").click(); }); await page.waitForSelector(".sheet");
  await page.evaluate(() => { const b = [...document.querySelectorAll(".sheet button")].filter((x) => /Supprimer le dossier/.test(x.textContent)); b[b.length - 1].click(); }); await sleep(600);
  d = await db();
  ok(!d.folders.some((f) => f.name === "Design") && d.notes.length === before && d.notes.find((n) => n.title === "Doc en dossier").folderId === "", "deleting a folder keeps its documents and moves them up");
  await go("/projects?tab=docs&p=p1");
  await page.evaluate(() => [...document.querySelectorAll(".row--doc")].find((x) => /Doc en dossier/.test(x.innerText)) || null);

  console.log("phone layout");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await go("/projects?tab=docs&p=p1");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal page scroll on phone (folder list)");
  await go("/projects/doc/" + pdf.id); await page.waitForSelector(".pdf-page canvas"); await sleep(500);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal page scroll on phone (PDF viewer)");

  console.log(errors.length ? "ERRORS:\n  " + errors.join("\n  ") : "no page errors");
  await browser.close();
  console.log(failures || errors.length ? `${failures} failure(s)` : "all folder/import checks passed");
  process.exitCode = failures || errors.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
