// End-to-end test of the project documents editor (Markdown WYSIWYG) in real Chrome.
// Run: node tools/hq-notes.cjs   (serve the repo first: npx http-server -p 4173 -c-1 .)
const puppeteer = require("puppeteer-core");
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
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message + " " + String(e.stack || "").slice(0, 400)));
  page.on("console", (m) => { if (m.type() === "error" && !/OperationError/.test(m.text())) errors.push("CONSOLE " + m.text()); });
  page.on("dialog", (d) => d.dismiss());
  const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await sleep(500); };
  const clickText = async (sel, text) => {
    const h = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t) && !e.closest("[hidden]")), sel, text);
    const el = h.asElement(); if (!el) throw new Error(`no ${sel} with "${text}"`);
    await el.click(); await sleep(250);
  };
  const tb = (label) => page.click(`.rte-bar [aria-label="${label}"]`).then(() => sleep(120));
  const stored = () => page.evaluate(() => { const n = HQ.store.db().notes; return n[n.length - 1]; });
  const selectText = (text) => page.evaluate((t) => {
    const ed = document.querySelector(".rte"); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const i = n.nodeValue.indexOf(t); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } }
    return false;
  }, text);

  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.waitForSelector(".lock-card");
  const pw = await page.$$("input[type=password]");
  await pw[0].type(PASS); await pw[1].type(PASS); await page.click("#ack"); await page.click("button[type=submit]");
  await page.waitForSelector(".shell", { timeout: 15000 });

  console.log("projects and documents");
  await page.evaluate(() => HQ.store.mutate((d) => { d.projects.push({ id: "p1", name: "Projet A", color: "#8a5cff", status: "active", clientId: "", description: "", url: "", deadline: "", createdAt: 1 }, { id: "p2", name: "Projet B", color: "#5cc8ff", status: "active", clientId: "", description: "", url: "", deadline: "", createdAt: 1 }); d.tasks.push({ id: "t1", projectId: "p1", title: "Tâche A", notes: "", status: "todo", priority: "med", due: "", estimateH: "", createdAt: 1, doneAt: null }, { id: "t2", projectId: "p2", title: "Tâche B", notes: "", status: "todo", priority: "med", due: "", estimateH: "", createdAt: 1, doneAt: null }); }));
  await go("/projects?p=p1");
  ok(await page.evaluate(() => /Tâche A/.test(document.body.innerText) && !/Tâche B/.test(document.body.innerText)), "each project shows only its own tasks");
  await clickText(".seg button", "Documents");
  ok(await page.evaluate(() => /Aucun document/.test(document.body.innerText)), "Documents tab starts empty");
  await clickText(".btn", "Nouveau document");
  await page.waitForSelector(".sheet form");
  await page.type(".sheet input[type=text]", "Spec de combat");
  await clickText(".sheet button", "Créer");
  await page.waitForSelector(".rte");
  ok(await page.evaluate(() => location.hash.startsWith("#/projects/doc/")), "document opens in the full-page editor");
  ok((await stored()).projectId === "p1", "document is attached to the selected project");

  console.log("formatting");
  await page.click(".rte"); await page.keyboard.type("Titre de test"); await page.keyboard.press("Enter");
  await page.keyboard.type("Du texte important et un autre mot.");
  await selectText("important"); await tb("Gras (Ctrl+B)");
  await selectText("autre"); await tb("Italique (Ctrl+I)");
  await selectText("mot"); await tb("Souligné (Ctrl+U)");
  await selectText("Du texte"); await tb("Barré");
  await selectText("Du texte"); await page.select(".rte-bar select[aria-label='Taille de police']", "28");
  await sleep(150);
  await selectText("Titre de test"); await page.select(".rte-bar select[aria-label='Style de paragraphe']", "h1");
  await selectText("important"); await page.select(".rte-bar select[aria-label='Police']", "Georgia, serif");
  await sleep(900);
  let n = await stored();
  console.log(n.md.split("\n").map((l) => "      | " + l).join("\n"));
  ok(/^# Titre de test/m.test(n.md), "heading 1 saved as Markdown");
  ok(/\*\*(<span[^>]*>)?important/.test(n.md), "bold applied", n.md);
  ok(/\*autre\*/.test(n.md), "italic applied", n.md);
  ok(/<u>mot<\/u>/.test(n.md), "underline applied", n.md);
  ok(/~~Du texte~~/.test(n.md) || /~~[^~]*Du texte/.test(n.md), "strikethrough applied", n.md);
  ok(/font-size: 28px/.test(n.md), "font size kept as inline style", n.md);
  ok(/font-family: Georgia/.test(n.md), "font family kept as inline style", n.md);
  ok(!/<font/.test(n.md), "no legacy <font> tags leak into the file", n.md);

  console.log("lists and table");
  await page.click(".rte"); await page.keyboard.down("Control"); await page.keyboard.press("End"); await page.keyboard.up("Control");
  await page.keyboard.press("Enter"); await tb("Liste à puces"); await page.keyboard.type("un"); await page.keyboard.press("Enter"); await page.keyboard.type("deux");
  await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
  await tb("Insérer un tableau"); await page.waitForSelector(".sheet form");
  await clickText(".sheet button", "Insérer");
  await sleep(300);
  ok(await page.evaluate(() => !!document.querySelector(".rte table th") && document.querySelectorAll(".rte table tr").length === 3), "3x3 table inserted with a header row");
  ok(await page.evaluate(() => !document.querySelector(".rte-tables").hidden), "table tools appear when the caret is in the table");
  await page.keyboard.type("Nom"); await page.keyboard.press("Tab"); await page.keyboard.type("Rôle"); await page.keyboard.press("Tab"); await page.keyboard.type("PV");
  await page.keyboard.press("Tab"); await page.keyboard.type("Jean"); await page.keyboard.press("Tab"); await page.keyboard.type("Dev");
  await clickText(".rte-tables button", "Ligne ↓");
  await clickText(".rte-tables button", "Colonne →");
  ok(await page.evaluate(() => document.querySelectorAll(".rte table tr").length === 4 && document.querySelectorAll(".rte table tr:first-child th").length === 4), "rows and columns can be added", "");
  await clickText(".rte-tables button", "Suppr. colonne");
  ok(await page.evaluate(() => document.querySelectorAll(".rte table tr:first-child th").length === 3), "a column can be deleted");
  await sleep(900);
  n = await stored();
  ok(/\| Nom \| Rôle \| PV \|/.test(n.md) && /\| --- \| --- \| --- \|/.test(n.md) && /\| Jean \| Dev \|/.test(n.md), "table saved as a GFM pipe table", n.md);
  ok(/^- un$/m.test(n.md) && /^- deux$/m.test(n.md), "bullet list saved", n.md);

  console.log("persistence, source and export");
  await page.evaluate(() => { location.hash = "/"; }); await sleep(500);
  await go("/projects/doc/" + n.id);
  await page.waitForSelector(".rte");
  ok(await page.evaluate(() => !!document.querySelector(".rte table") && !!document.querySelector(".rte h1") && !!document.querySelector(".rte u") && !!document.querySelector(".rte em")), "reopening restores the formatted document");
  await clickText("button", "Markdown");
  ok(await page.evaluate(() => !document.querySelector(".rte-src").hidden && /\| Nom \|/.test(document.querySelector(".rte-src").value)), "source mode shows the Markdown");
  await page.evaluate(() => { const s = document.querySelector(".rte-src"); s.value += "\n\nAjout **depuis la source**\n"; s.dispatchEvent(new Event("input")); });
  await clickText("button", "Markdown"); await sleep(900);
  ok(await page.evaluate(() => /depuis la source/.test(document.querySelector(".rte").innerText) && !!document.querySelector(".rte strong")), "edits made in source mode come back in the visual editor");
  await page.evaluate(() => { location.hash = "/projects?tab=docs&p=p1"; }); await sleep(600);
  ok(await page.evaluate(() => /Spec de combat/.test(document.body.innerText) && /Documents · 1/.test(document.body.innerText)), "document is listed in its project with a counter");
  await go("/projects?tab=docs&p=p2");
  ok(await page.evaluate(() => /Aucun document/.test(document.body.innerText)), "other projects do not show it");

  console.log("paste and security");
  await go("/projects/doc/" + n.id); await page.waitForSelector(".rte");
  await page.evaluate(() => {
    const ed = document.querySelector(".rte"); ed.focus();
    const dt = new DataTransfer(); dt.setData("text/html", '<p onmouseover="window.__pwned=1">collé <b>fort</b></p><script>window.__pwned=2</script><img src=x onerror="window.__pwned=3">'); dt.setData("text/plain", "collé fort");
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await sleep(900);
  ok(await page.evaluate(() => window.__pwned === undefined && !document.querySelector(".rte img, .rte script, .rte [onmouseover]")), "pasted HTML is sanitised");
  await go("/projects?tab=docs&p=p1");
  await page.evaluate(() => HQ.store.mutate((d) => { d.notes.push({ id: "x", projectId: "p1", title: "Importé", md: "Salut <script>window.__pwned=9</script> [x](javascript:window.__pwned=8)\n", createdAt: 1, updatedAt: 1 }); }));
  await go("/projects/doc/x"); await page.waitForSelector(".rte");
  ok(await page.evaluate(() => window.__pwned === undefined && !document.querySelector(".rte script") && !/javascript:/.test(document.querySelector(".rte").innerHTML)), "a malicious .md is neutralised on open");

  console.log("phone layout");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await go("/projects/doc/" + n.id); await page.waitForSelector(".rte");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal page scroll on phone");

  console.log("delete");
  await page.setViewport({ width: 1280, height: 900 });
  await go("/projects/doc/x"); await page.waitForSelector(".rte");
  await clickText(".btn", "Supprimer"); await page.waitForSelector(".sheet"); await clickText(".sheet button", "Supprimer"); await sleep(500);
  ok(await page.evaluate(() => !HQ.store.db().notes.some((d) => d.id === "x")), "document can be deleted");

  console.log(errors.length ? "ERRORS:\n  " + errors.join("\n  ") : "no page errors");
  await browser.close();
  console.log(failures || errors.length ? `${failures} failure(s)` : "all notes checks passed");
  process.exitCode = failures || errors.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
