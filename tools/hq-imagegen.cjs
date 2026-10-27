// End-to-end test of image generation in Apex Prompt Studio, with the provider APIs mocked (no key, no cost).
// Run: node tools/hq-imagegen.cjs   (serve the repo first: npx http-server -p 4173 -c-1 .)
const puppeteer = require("puppeteer-core");
const BASE = process.env.HQ_BASE || "http://localhost:4173/hq-r7k29m/";
const PASS = "phrase de test numero un";
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const ok = (c, msg, extra) => { console.log(c ? "  ok  " : "  FAIL", msg, c ? "" : "\n      " + extra); if (!c) failures++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [], calls = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/OperationError|Failed to load resource/.test(m.text())) errors.push("CONSOLE " + m.text()); });
  await page.setRequestInterception(true);
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" };
  let mode = "ok";
  page.on("request", (r) => {
    const u = r.url();
    if (!/api\.openai\.com|generativelanguage\.googleapis\.com|custom\.example/.test(u)) return r.continue();
    if (r.method() === "OPTIONS") return r.respond({ status: 204, headers: cors });
    calls.push({ url: u, headers: r.headers(), body: r.postData() ? JSON.parse(r.postData()) : null });
    if (mode === "401") return r.respond({ status: 401, headers: cors, contentType: "application/json", body: JSON.stringify({ error: { message: "Incorrect API key" } }) });
    if (/openai|custom/.test(u)) return r.respond({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ data: Array.from({ length: (JSON.parse(r.postData()).n) || 1 }, () => ({ b64_json: PNG })) }) });
    if (/:predict/.test(u)) return r.respond({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG, mimeType: "image/png" }] }) });
    return r.respond({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }, { inlineData: { mimeType: "image/png", data: PNG } }] } }] }) });
  });
  const clickText = async (sel, text) => {
    const h = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t) && !e.closest("[hidden]")), sel, text);
    const el = h.asElement(); if (!el) throw new Error(`no ${sel} with "${text}"`);
    await el.click(); await sleep(250);
  };
  const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await sleep(600); };

  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.waitForSelector(".lock-card");
  const pw = await page.$$("input[type=password]");
  await pw[0].type(PASS); await pw[1].type(PASS); await page.click("#ack"); await page.click("button[type=submit]");
  await page.waitForSelector(".shell", { timeout: 15000 });
  await go("/tools/apex");
  await page.waitForSelector(".gen-out");

  console.log("without a key");
  await clickText(".gen-out .btn", "Générer l'image");
  await page.waitForSelector(".sheet");
  ok(await page.evaluate(() => /réglages API/i.test(document.querySelector(".sheet").innerText)), "asking to generate without a key opens the API settings");

  console.log("settings");
  const inputs = await page.$$(".sheet input[type=password]");
  await inputs[0].type("sk-test-openai"); await inputs[1].type("goog-test");
  await clickText(".sheet button", "Enregistrer"); await sleep(500);
  ok(await page.evaluate(() => HQ.store.local().imagegen.keys.openai === "sk-test-openai"), "keys are saved in the device-local slot");
  ok(await page.evaluate(() => !JSON.stringify(HQ.store.db()).includes("sk-test-openai") && !JSON.stringify(HQ.merge ? HQ.merge.cloudView(HQ.store.db()) : {}).includes("sk-test")), "keys are not part of the synced data");
  ok(await page.evaluate(() => !localStorage.getItem("n29hq.local") || !Object.values(localStorage).join("").includes("sk-test-openai")), "keys are not readable in localStorage");

  console.log("OpenAI");
  await page.select(".gen-out select:nth-of-type(1)", "openai").catch(() => {});
  await clickText(".gen-out .btn", "Générer l'image");
  await page.waitForFunction(() => /enregistrée/.test(document.querySelector(".gen-out").innerText), { timeout: 10000 });
  let c = calls[calls.length - 1];
  ok(/api\.openai\.com\/v1\/images\/generations$/.test(c.url) && c.headers.authorization === "Bearer sk-test-openai", "request goes to OpenAI with the bearer key", JSON.stringify(c.headers));
  ok(c.body.model === "gpt-image-1" && c.body.size === "1536x1024" && /Avoid:/.test(c.body.prompt) && c.body.prompt.length > 40, "model, landscape size and prompt (with negatives) are sent", JSON.stringify(c.body).slice(0, 300));
  ok(await page.evaluate(() => document.querySelectorAll(".gen-out img").length === 1), "the image appears under the prompt");

  console.log("Google");
  await page.evaluate(() => { const s = document.querySelector(".gen-out select"); s.value = "google"; s.dispatchEvent(new Event("change", { bubbles: true })); });
  await sleep(200);
  await clickText(".gen-out .btn", "Générer l'image");
  await page.waitForFunction(() => document.querySelectorAll(".gen-out img").length === 2, { timeout: 10000 });
  c = calls[calls.length - 1];
  ok(/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash-image:generateContent$/.test(c.url) && c.headers["x-goog-api-key"] === "goog-test", "Gemini request carries the key in a header, not the URL", c.url);
  ok(c.body.generationConfig.imageConfig.aspectRatio === "16:9", "aspect ratio is passed");
  await page.evaluate(() => { const i = document.querySelector(".gen-out input[list]"); i.value = "imagen-4.0-generate-001"; });
  await clickText(".gen-out .btn", "Générer l'image");
  await page.waitForFunction(() => document.querySelectorAll(".gen-out img").length === 3, { timeout: 10000 });
  ok(/:predict$/.test(calls[calls.length - 1].url) && calls[calls.length - 1].body.parameters.aspectRatio === "16:9", "Imagen models use the predict endpoint");

  console.log("errors");
  mode = "401";
  await page.evaluate(() => { const s = document.querySelector(".gen-out select"); s.value = "openai"; s.dispatchEvent(new Event("change", { bubbles: true })); });
  await sleep(200);
  await clickText(".gen-out .btn", "Générer l'image");
  await page.waitForFunction(() => /Échec/.test(document.querySelector(".gen-out").innerText), { timeout: 10000 });
  ok(await page.evaluate(() => /refusée/.test(document.querySelector(".gen-out").innerText)), "a rejected key gives a clear message");
  mode = "ok";

  console.log("gallery");
  await clickText(".tabs-inline button", "Images"); await sleep(600);
  ok(await page.evaluate(() => [...document.querySelectorAll("#view img")].filter((i) => i.offsetParent).length === 3), "the Images tab lists the three generated images");
  await page.evaluate(() => [...document.querySelectorAll("#view img")].find((i) => i.offsetParent).closest("button").click());
  await page.waitForSelector(".sheet img");
  ok(await page.evaluate(() => /Télécharger/.test(document.querySelector(".sheet").innerText)), "an image opens with download / copy / delete");
  await clickText(".sheet button", "Supprimer"); await sleep(400); await page.evaluate(() => { const b = [...document.querySelectorAll(".sheet button")].filter((x) => x.textContent.trim() === "Supprimer"); b[b.length - 1].click(); }); await sleep(900);
  ok(await page.evaluate(() => [...document.querySelectorAll("#view img")].filter((i) => i.offsetParent).length === 2), "an image can be deleted");

  console.log(errors.length ? "ERRORS:\n  " + errors.join("\n  ") : "no page errors");
  await browser.close();
  console.log(failures || errors.length ? `${failures} failure(s)` : "all image generation checks passed");
  process.exitCode = failures || errors.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
