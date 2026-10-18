// Run: npm i --no-save puppeteer-core && node tools/hq-pwa.cjs   (repo served on :4173; CHROME / HQ_BASE optional)
// Asks Chrome itself whether the app is installable (CDP: Page.getInstallabilityErrors + manifest).
const puppeteer = require("puppeteer-core");
const BASE = process.env.HQ_BASE || "http://localhost:4173/hq-r7k29m/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await sleep(2500); // let the service worker install and activate
  const cdp = await page.createCDPSession();
  await cdp.send("Page.enable");
  const inst = await cdp.send("Page.getInstallabilityErrors");
  const man = await cdp.send("Page.getAppManifest");
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? { scope: r.scope, active: !!r.active } : null; });
  console.log("installability errors:", JSON.stringify(inst.installabilityErrors));
  console.log("manifest errors:", JSON.stringify(man.errors || []));
  console.log("manifest url:", man.url);
  const parsed = JSON.parse(man.data || "{}");
  console.log("name:", parsed.name, "| display:", parsed.display, "| icons:", (parsed.icons || []).map((i) => i.sizes + (i.purpose ? "/" + i.purpose : "")).join(", "));
  console.log("service worker:", JSON.stringify(sw));
  // the install button/banners are visible in a normal (non-standalone) browser tab
  console.log("lock screen has install button:", await page.evaluate(() => !!document.querySelector("[data-install]")));
  // simulate Chrome's install prompt to check the in-app button drives it
  const drove = await page.evaluate(async () => { let called = 0; HQ.installPrompt = { prompt() { called++; }, userChoice: Promise.resolve({ outcome: "accepted" }) }; document.querySelector("[data-install]").click(); await new Promise((r) => setTimeout(r, 200)); return { called, cleared: HQ.installPrompt === null }; });
  console.log("button triggers the native prompt:", JSON.stringify(drove));
  // without a native prompt, the button explains how to install
  await page.evaluate(() => { document.querySelector("[data-install]").click(); });
  await sleep(500);
  console.log("help sheet shown when no native prompt:", await page.evaluate(() => /Installer l'application/.test((document.querySelector(".sheet") || {}).innerText || "") ));
  console.log(errs.length ? "PAGE ERRORS " + errs.join("; ") : "no page errors");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
