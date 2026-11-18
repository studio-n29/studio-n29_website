// Site checks. Run: npm run check
// 1. every relative href/src/srcset in generated .html resolves to a file  2. every data-i18n key exists in fr + en
// 3. both languages define the same keys  4. protected folders (hidden URLs) are unchanged (path+size fingerprint).
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { ROOT, fr, en } from "./lib/data.mjs";

const errors = [];
const pages = ["index.html", "heroes-dawn.html", "portfolio.html", "studio.html", "hell-rising.html", "contact.html", ...readdirSync(join(ROOT, "projects")).map((f) => `projects/${f}`)];

for (const page of pages) {
  const html = readFileSync(join(ROOT, page), "utf8");
  const refs = [];
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(",").forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    const clean = ref.split("#")[0].split("?")[0];
    if (!clean) continue;
    if (!existsSync(join(ROOT, dirname(page), clean))) errors.push(`${page}: missing file ${ref}`);
  }
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) {
    if (!(m[1] in en) || !(m[1] in fr)) errors.push(`${page}: i18n key ${m[1]} missing`);
  }
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    m[1].split(";").forEach((pair) => { const k = pair.split(":")[1]; if (!(k in en) || !(k in fr)) errors.push(`${page}: i18n attr key ${k} missing`); });
  }
}
for (const k of Object.keys(en)) if (!(k in fr)) errors.push(`fr is missing key ${k}`);
for (const k of Object.keys(fr)) if (!(k in en)) errors.push(`en is missing key ${k}`);

const PROTECTED = ["hd-legal-4f7a2c91e6b3", "hd-test-2088620bed5f92562b0e18cc", "hq-r7k29m", "d-pwqxes9jai6i", "CNAME"];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((f) => walk(join(p, f))) : [`${p.slice(ROOT.length)}:${statSync(p).size}`]);
const finger = Object.fromEntries(PROTECTED.map((d) => [d, createHash("sha1").update(walk(join(ROOT, d)).join("\n")).digest("hex")]));
const fpFile = join(ROOT, "tools/.protected.json");
if (!existsSync(fpFile)) { writeFileSync(fpFile, JSON.stringify(finger, null, 2) + "\n"); console.log("Protected fingerprint recorded."); }
else {
  const saved = JSON.parse(readFileSync(fpFile, "utf8"));
  for (const d of PROTECTED) if (saved[d] !== finger[d]) errors.push(`protected path changed: ${d}`);
}

if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK — ${pages.length} pages checked.`);
