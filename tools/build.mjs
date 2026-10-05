// Dev-time page generator. Run: node tools/build.mjs
// Renders index.html + projects/*.html with the French copy from i18n/fr.json pre-filled
// (SEO + no flash). The output is plain static HTML; js/i18n.js swaps in English at runtime.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fr = JSON.parse(readFileSync(join(ROOT, "i18n/fr.json"), "utf8"));
const en = JSON.parse(readFileSync(join(ROOT, "i18n/en.json"), "utf8"));
const base = en; // English is the default language: pre-rendered in the HTML
const SITE = "https://n29-studio.fr";
const EMAIL = "dm.nathiez@gmail.com";
const ACCESS_KEY = "2061a5e7-2cc7-434f-b98f-9d11cdc1b6da"; // Web3Forms public key (client-side by design)

const t = (k) => {
  if (!(k in base)) throw new Error(`Missing i18n key: ${k}`);
  return base[k];
};
// Element with translatable text. html=true allows markup in the value.
const tx = (tag, key, cls = "", html = false, extra = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""}${extra ? " " + extra : ""} ${html ? "data-i18n-html" : "data-i18n"}="${key}">${t(key)}</${tag}>`;

const m = (slug, list) => list.map(([f, w, h]) => ({ src: `${slug}/${f}`, w, h }));
const PROJECTS = [
  { slug: "heroes-dawn", name: "Heroes Dawn", cover: "heroes-dawn-cover.jpg", engine: "Unity 6", tech: ["Unity 6", "C#", "Mobile", "Game design"], c: 4, status: "wip", featured: true,
    media: [{ src: "heroes-dawn-cover.jpg", w: 1600, h: 900 }, { src: "hd-hq.jpg", w: 1000, h: 563 }, { src: "hd-operations.jpg", w: 1000, h: 563 }, { src: "hd-roster.jpg", w: 1000, h: 563 }] },
  { slug: "discosmos", name: "Discosmos", cover: "discosmos/06.webp", coverPos: "50% 14%", engine: "Unity (URP)", tech: ["Unity", "C#", "Photon", "Netcode"], c: 4,
    media: m("discosmos", [["06.webp", 1326, 2048], ["01.webp", 512, 394], ["02.webp", 512, 364], ["03.webp", 512, 353], ["04.webp", 527, 445], ["05.webp", 601, 513]]) },
  { slug: "beat-strike", name: "Beat Strike", cover: "beat-strike/01.webp", engine: "Unity 2021 LTS", tech: ["Unity", "C#", "Editor tools", "Rhythm engine"], c: 5,
    media: m("beat-strike", [["01.webp", 1913, 1011], ["04.webp", 1253, 711], ["02.webp", 279, 635], ["03.webp", 296, 239], ["05.webp", 294, 284], ["06.webp", 512, 503], ["07.webp", 362, 646], ["08.webp", 294, 640]]) },
  { slug: "delight", name: "Delight", cover: "delight/07.webp", engine: "Unity 6", tech: ["Unity 6", "C#", "FSM AI", "Audio"], c: 5,
    video: "https://www.youtube.com/watch?v=Ls7xzg5Ivjg",
    media: m("delight", [["07.webp", 1124, 554], ["01.webp", 890, 490], ["02.webp", 512, 408], ["03.webp", 512, 309], ["04.webp", 638, 508], ["05.webp", 512, 224], ["06.webp", 638, 508]]) },
  { slug: "sweet-courrier", name: "Sweet Courrier", cover: "sweet-courrier/02.webp", engine: "Unity", tech: ["Unity", "C#", "Physics", "Local co-op"], c: 3,
    media: m("sweet-courrier", [["02.webp", 512, 304], ["03.webp", 512, 272], ["04.webp", 667, 211], ["05.webp", 612, 442], ["06.webp", 512, 272]]) },
  { slug: "project-x", name: "Project X", cover: "project-x-cover.svg", engine: "Unity", tech: ["Unity", "C#"], c: 3, status: "nda", nda: true },
];

const logo = (cls = "") => `<svg class="${cls}" viewBox="220 255 585 515" aria-hidden="true"><g fill="currentColor"><polygon class="n-a" points="437,263 570,298 514,318 300,646 288,612 228,700 250,605 231,575"/><polygon class="n-b" points="567,350 705,400 567,581"/><polygon class="n-c" points="501,436 501,682 794,396 546,761 361,653"/></g></svg>`;

const head = ({ title, desc, prefix, canonical, extra = "", htmlAttrs = "" }) => `<!doctype html>
<html lang="en" data-root="${prefix}"${htmlAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#07070a">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${prefix}assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="${prefix}favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="STUDIO N29">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${prefix}assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${prefix}css/base.css">
<link rel="stylesheet" href="${prefix}css/components.css">
<link rel="stylesheet" href="${prefix}css/animations.css">
${extra}</head>`;

const header = (prefix, home) => {
  const h = home ? "" : `${prefix}index.html`;
  const link = (id, key) => `<a href="${h}#${id}" ${"data-i18n"}="${key}">${t(key)}</a>`;
  return `<a class="skip" href="#main" data-i18n="skip">${t("skip")}</a>
<div class="page-slash" aria-hidden="true"></div>
<div class="cursor" aria-hidden="true"></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${home ? "#top" : prefix + "index.html"}" aria-label="STUDIO N29">${logo()}<span>STUDIO N29</span></a>
    <nav class="nav" id="nav" aria-label="Navigation">
      ${link("projects", "nav.projects")}
      ${link("about", "nav.about")}
      ${link("skills", "nav.skills")}
      ${link("journey", "nav.journey")}
      ${link("contact", "nav.contact")}
      <a class="btn btn--solid btn--sm" href="${h}#contact"><span data-i18n="nav.cta">${t("nav.cta")}</span></a>
    </nav>
    <div class="header-tools">
      <div class="lang" role="group" aria-label="Language"><button type="button" data-lang="fr" aria-pressed="false">FR</button><button type="button" data-lang="en" aria-pressed="true">EN</button></div>
      <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu" data-i18n-attr="aria-label:nav.menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
};

const footer = () => `<footer class="site-footer">
  <div class="wrap">
    <span>© <span id="year">2026</span> STUDIO N29 — Djason Nathiez</span>
    <span ${"data-i18n"}="foot.nda">${t("foot.nda")}</span>
    <div class="foot-links"><a href="mailto:${EMAIL}">${EMAIL}</a></div>
  </div>
</footer>`;

const scripts = (prefix, form, lightbox) => `<script src="${prefix}js/i18n-data.js" defer></script>
<script src="${prefix}js/i18n.js" defer></script>
<script src="${prefix}js/ui.js" defer></script>
${form ? `<script src="${prefix}js/form.js" defer></script>\n` : ""}${lightbox ? `<script src="${prefix}js/lightbox.js" defer></script>\n` : ""}</body>
</html>
`;

const card = (p, prefix = "") => {
  const badge = p.status ? `<span class="badge badge--${p.status}" data-i18n="status.${p.status}">${t("status." + p.status)}</span>` : "";
  return `<article class="card reveal${p.nda ? " card--nda" : ""}${p.featured ? " card--featured" : ""}">
        <div class="card-media"><img src="${prefix}assets/projects/${p.cover}" alt="" loading="lazy" decoding="async" width="1200" height="750"${p.coverPos ? ` style="object-position:${p.coverPos}"` : ""}></div>
        <div class="card-body">
          ${p.featured ? `<span class="eyebrow" data-i18n="projects.featured">${t("projects.featured")}</span>` : ""}
          <div class="card-meta">${tx("span", `p.${p.slug}.type`)}${badge}</div>
          <h3><a class="card-link" href="${prefix}projects/${p.slug}.html">${p.name}</a></h3>
          ${tx("p", `p.${p.slug}.role`, "role")}
          ${tx("p", `p.${p.slug}.desc`)}
          <ul class="tags">${p.tech.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
      </article>`;
};

// ---------------------------------------------------------------- index
const skills = [
  ["01", ["C#", "Unity", "State machines", "ScriptableObjects", "Game feel"]],
  ["02", ["Photon", "RPC", "State sync", "Rooms"]],
  ["03", ["Editor scripting", "Custom inspectors", "Data-driven"]],
  ["04", ["Object pooling", "Addressables", "Serialization", "Design patterns"]],
  ["05", ["TypeScript", "Python", "Neo4j", "SQL / NoSQL", "Dart"]],
  ["06", ["Git", "Google Cloud", "Blender", "Unreal Engine", "C++"]],
];
const journey = [1, 2, 3, 4];
const marquee = ["Unity", "C#", "Gameplay", "Photon", "Editor tools", "Game feel", "Netcode", "Systems", "Unity 6", "Freelance"];

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Djason Nathiez",
  jobTitle: "Unity Gameplay Programmer (freelance)",
  url: SITE + "/",
  email: EMAIL,
  alumniOf: { "@type": "CollegeOrUniversity", name: "Rubika — Supinfogame" },
  worksFor: { "@type": "Organization", name: "STUDIO N29", url: SITE + "/" },
  knowsAbout: ["Unity", "C#", "Gameplay programming", "Multiplayer networking", "Photon", "Editor tooling", "Game development"],
  address: { "@type": "PostalAddress", addressRegion: "Hauts-de-France", addressCountry: "FR" },
};

const index = `${head({
  title: t("meta.title"), desc: t("meta.description"), prefix: "", canonical: SITE + "/",
  extra: `<script type="application/ld+json">${JSON.stringify(person)}</script>\n`,
})}
<body id="top">
${header("", true)}
<main id="main">
  <section class="hero">
    <div class="wrap">
      <div>
        <span class="hero-status intro" style="--d:.1s"><i></i>${tx("span", "hero.status")}</span>
        <h1><span class="line"><span style="--d:.15s" data-i18n="hero.l1">${t("hero.l1")}</span></span><span class="line"><span style="--d:.3s" data-i18n-html="hero.l2">${t("hero.l2")}</span></span></h1>
        ${tx("p", "hero.role", "hero-role intro", true, 'style="--d:.6s"')}
        ${tx("p", "hero.lead", "hero-lead intro", false, 'style="--d:.7s"')}
        <div class="hero-cta intro" style="--d:.85s">
          <a class="btn btn--solid" href="#projects"><span data-i18n="hero.cta1">${t("hero.cta1")}</span><span class="arrow" aria-hidden="true">→</span></a>
          <a class="btn btn--ghost" href="#contact"><span data-i18n="hero.cta2">${t("hero.cta2")}</span></a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true"><span class="slash"></span>${logo("logo-big")}</div>
    </div>
    <div class="scroll-cue" aria-hidden="true"><span data-i18n="hero.scroll">${t("hero.scroll")}</span></div>
  </section>

  <div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => marquee.map((m) => `<span>${m}</span>`).join("")).join("")}</div></div>

  <section class="section" id="projects">
    <div class="wrap">
      <div class="section-head">
        <div class="reveal">
          ${tx("span", "projects.eyebrow", "eyebrow")}
          ${tx("h2", "projects.title", "section-title")}
        </div>
        ${tx("p", "projects.lead", "lead reveal", false, 'style="--d:.1s"')}
      </div>
      <div class="projects-grid">
      ${PROJECTS.map((p) => card(p)).join("\n      ")}
      </div>
    </div>
  </section>

  <section class="section section--cut" id="about">
    <div class="wrap about-grid">
      <div class="reveal">
        ${tx("span", "about.eyebrow", "eyebrow")}
        ${tx("h2", "about.title", "section-title")}
      </div>
      <div class="about-text reveal" style="--d:.1s">
        ${tx("p", "about.p1", "", true)}
        ${tx("p", "about.p2")}
        ${tx("p", "about.p3")}
        <div class="facts">
          <div class="fact"><b>6</b>${tx("span", "about.f1.l")}</div>
          <div class="fact"><b>C#</b>${tx("span", "about.f2.l")}</div>
          <div class="fact"><b>2019–23</b>${tx("span", "about.f3.l")}</div>
          <div class="fact">${tx("b", "about.f4.n")}${tx("span", "about.f4.l")}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="skills">
    <div class="wrap">
      <div class="reveal">
        ${tx("span", "skills.eyebrow", "eyebrow")}
        ${tx("h2", "skills.title", "section-title")}
      </div>
      <div class="skills-grid">
        ${skills.map(([n, chips], i) => `<article class="skill reveal" style="--d:${(i % 3) * 0.08}s">
          <span class="idx">${n}</span>
          ${tx("h3", `skills.${i + 1}.t`)}
          ${tx("p", `skills.${i + 1}.d`)}
          <ul class="chips">${chips.map((c) => `<li>${c}</li>`).join("")}</ul>
        </article>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section section--cut" id="journey">
    <div class="wrap">
      <div class="reveal">
        ${tx("span", "journey.eyebrow", "eyebrow")}
        ${tx("h2", "journey.title", "section-title")}
      </div>
      <div class="timeline">
        ${journey.map((n) => `<div class="t-item reveal">
          ${tx("div", `journey.${n}.date`, "t-date")}
          <div><h3>${tx("span", `journey.${n}.t`)}<small data-i18n="journey.${n}.o">${t(`journey.${n}.o`)}</small></h3>${tx("p", `journey.${n}.d`)}</div>
        </div>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section" id="contact">
    <div class="wrap contact-grid">
      <div class="reveal">
        ${tx("span", "contact.eyebrow", "eyebrow")}
        ${tx("h2", "contact.title", "section-title")}
        ${tx("p", "contact.lead", "lead")}
        <div class="contact-list">
          <a href="mailto:${EMAIL}">${tx("small", "contact.email")}<span>${EMAIL}</span></a>
          <a href="https://www.linkedin.com/in/djason-nathiez-391b2b365" target="_blank" rel="noopener">${tx("small", "contact.linkedin")}<span>linkedin.com/in/djason-nathiez</span></a>
          <a href="${SITE}/">${tx("small", "contact.web")}<span>n29-studio.fr</span></a>
          <div>${tx("small", "contact.where")}${tx("span", "contact.where.v")}</div>
        </div>
      </div>
      <form class="form reveal" id="contact-form" style="--d:.1s">
        <input type="hidden" name="access_key" value="${ACCESS_KEY}">
        <input type="hidden" name="subject" value="Nouveau message — portfolio STUDIO N29">
        <input type="hidden" name="from_name" value="Portfolio STUDIO N29">
        <input class="hp" type="text" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="field">${tx("label", "form.name", "", false, 'for="f-name"')}<input id="f-name" name="name" type="text" autocomplete="name" required></div>
        <div class="field">${tx("label", "form.email", "", false, 'for="f-email"')}<input id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field">${tx("label", "form.topic", "", false, 'for="f-topic"')}
          <select id="f-topic" name="topic" required>
            <option value="" disabled selected ${"data-i18n"}="form.topic.0">${t("form.topic.0")}</option>
            <option value="freelance" data-i18n="form.topic.1">${t("form.topic.1")}</option>
            <option value="collab" data-i18n="form.topic.2">${t("form.topic.2")}</option>
            <option value="other" data-i18n="form.topic.3">${t("form.topic.3")}</option>
          </select></div>
        <div class="field">${tx("label", "form.message", "", false, 'for="f-message"')}<textarea id="f-message" name="message" required></textarea></div>
        <button class="btn btn--solid" type="submit" data-i18n="form.send">${t("form.send")}</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>
</main>
${footer()}
${scripts("", true)}`;

// ---------------------------------------------------------------- project pages
const projectPage = (p) => {
  const k = (s) => `p.${p.slug}.${s}`;
  const badge = p.status ? `<span class="badge badge--${p.status}" data-i18n="status.${p.status}">${t("status." + p.status)}</span>` : "";
  const contrib = Array.from({ length: p.c }, (_, i) => `<li data-i18n-html="${k("c" + (i + 1))}">${t(k("c" + (i + 1)))}</li>`).join("\n            ");
  const others = PROJECTS.filter((x) => x.slug !== p.slug);
  const desc = t(k("tagline"));
  const title = t("meta.title.project").replace("{name}", p.name);
  return `${head({ title, desc, prefix: "../", canonical: `${SITE}/projects/${p.slug}.html`, htmlAttrs: ` data-project="${p.slug}" data-project-name="${p.name}"` })}
<body>
${header("../", false)}
<main id="main">
  <section class="p-hero">
    <div class="wrap">
      <a class="back" href="../index.html#projects"><span aria-hidden="true">←</span><span data-i18n="pg.back">${t("pg.back")}</span></a>
      <div style="margin-top:1.8rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><span class="eyebrow" data-i18n="${k("type")}">${t(k("type"))}</span>${badge}</div>
      <h1>${p.name}</h1>
      ${tx("p", k("tagline"), "tagline")}
    </div>
  </section>
  ${p.media ? `<section class="shots"><div class="wrap">
    <div class="gallery" data-gallery>${p.media.map((x, i) => `<button type="button" class="shot reveal" style="--d:${(i % 3) * 0.07}s" aria-label="${t("pg.zoom")}" data-i18n-attr="aria-label:pg.zoom"><img src="../assets/projects/${x.src}" alt="${p.name} — ${i + 1}" width="${x.w}" height="${x.h}" loading="lazy" decoding="async"></button>`).join("")}</div>
    ${p.video ? `<p style="margin-top:1.5rem"><a class="btn btn--ghost btn--sm" href="${p.video}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span><span data-i18n="pg.watch">${t("pg.watch")}</span></a></p>` : ""}
  </div></section>` : `<div class="p-cover reveal"><img src="../assets/projects/${p.cover}" alt="${p.name}" width="1600" height="900"></div>`}
  <section class="section" style="padding-top:3rem">
    <div class="wrap">
      <div class="p-meta">
        <div>${tx("small", "pg.role")}${tx("span", k("meta.role"))}</div>
        <div>${tx("small", "pg.engine")}<span>${p.engine}</span></div>
        <div>${tx("small", "pg.team")}${tx("span", k("meta.team"))}</div>
        <div>${tx("small", "pg.tech")}<span>${p.tech.slice(0, 3).join(" · ")}</span></div>
      </div>
      <div style="height:clamp(3rem,7vw,6rem)"></div>
      ${p.nda ? `<div class="notice reveal" style="margin-bottom:3rem" data-i18n="${k("notice")}">${t(k("notice"))}</div>` : ""}
      <div class="p-block p-body reveal">
        ${tx("h2", "pg.context")}
        ${tx("p", k("ctx"))}
      </div>
      <div class="p-block p-body reveal">
        ${tx("h2", "pg.contrib")}
        <ul class="checks">
            ${contrib}
        </ul>
      </div>
    </div>
  </section>
  <section class="section section--cut">
    <div class="wrap">
      <div class="next reveal">
        ${tx("h2", "pg.next.title")}
        <a class="btn btn--solid" href="../index.html#contact"><span data-i18n="pg.next.cta">${t("pg.next.cta")}</span><span class="arrow" aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="reveal">${tx("span", "pg.more", "eyebrow")}</div>
      <div class="projects-grid" style="margin-top:2rem">
        ${others.map((o) => card(o, "../")).join("\n        ")}
      </div>
    </div>
  </section>
</main>
${footer()}
${scripts("../", false, !!p.media)}`;
};

writeFileSync(join(ROOT, "js/i18n-data.js"), `/* Generated by tools/build.mjs from i18n/*.json — do not edit */\nwindow.N29_I18N = ${JSON.stringify({ fr, en })};\n`);
mkdirSync(join(ROOT, "projects"), { recursive: true });
writeFileSync(join(ROOT, "index.html"), index);
PROJECTS.forEach((p) => writeFileSync(join(ROOT, "projects", `${p.slug}.html`), projectPage(p)));

const urls = ["", ...PROJECTS.map((p) => `projects/${p.slug}.html`)];
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built index + ${PROJECTS.length} project pages.`);
