// Shared page chrome: <head>, header, footer, scripts, small components.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, SITE, EMAIL, LINKEDIN, MALT, STEAM_URL, projectHref, t, tx } from "./data.mjs";

/** Cache-busting: `file?v=<hash of the file>` so browsers and GitHub Pages never serve a stale CSS/JS after a deploy. */
const ver = (rel) => `${rel}?v=${createHash("md5").update(readFileSync(join(ROOT, rel))).digest("hex").slice(0, 8)}`;

export const logo = (cls = "") => `<svg class="${cls}" viewBox="220 255 585 515" aria-hidden="true"><g fill="currentColor"><polygon class="n-a" points="437,263 570,298 514,318 300,646 288,612 228,700 250,605 231,575"/><polygon class="n-b" points="567,350 705,400 567,581"/><polygon class="n-c" points="501,436 501,682 794,396 546,761 361,653"/></g></svg>`;

export const head = ({ title, desc, prefix, canonical, page, extra = "", htmlAttrs = "", image = `${SITE}/assets/og.jpg` }) => `<!doctype html>
<html lang="en" data-root="${prefix}"${page ? ` data-page="${page}"` : ""}${htmlAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#06080d">
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
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${prefix}assets/fonts/barlow-condensed-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${prefix}assets/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${prefix}${ver("css/base.css")}">
<link rel="stylesheet" href="${prefix}${ver("css/components.css")}">
<link rel="stylesheet" href="${prefix}${ver("css/studio.css")}">
<link rel="stylesheet" href="${prefix}${ver("css/animations.css")}">
${extra}</head>`;

/** Wishlist button. Without STEAM_URL it is an inert "coming soon" badge (never a dead link). */
export const wishlist = (cls = "") => STEAM_URL
  ? `<a class="btn btn--solid ${cls}" href="${STEAM_URL}" target="_blank" rel="noopener"><span data-i18n="wish.cta">${t("wish.cta")}</span><span class="arrow" aria-hidden="true">↗</span></a>`
  : `<span class="btn btn--soon ${cls}" role="note"><i aria-hidden="true"></i><span data-i18n="wish.soon">${t("wish.soon")}</span></span>`;

const NAV = [
  ["heroes", "heroes-dawn.html", "nav.heroes"],
  ["studio", "studio.html", "nav.studio"],
  ["portfolio", "portfolio.html", "nav.portfolio"],
  ["contact", "contact.html", "nav.contact"],
];

export const header = (prefix, current) => `<a class="skip" href="#main" data-i18n="skip">${t("skip")}</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${prefix}index.html" aria-label="STUDIO N29">${logo()}<span>STUDIO N29</span></a>
    <nav class="nav" id="nav" aria-label="Navigation">
      ${NAV.map(([id, href, key]) => `<a href="${prefix}${href}"${current === id ? ' class="is-active" aria-current="page"' : ""} data-i18n="${key}">${t(key)}</a>`).join("\n      ")}
      ${wishlist("btn--sm nav-cta")}
    </nav>
    <div class="header-tools">
      ${wishlist("btn--sm header-cta")}
      <div class="lang" role="group" aria-label="Language"><button type="button" data-lang="fr" aria-pressed="false">FR</button><button type="button" data-lang="en" aria-pressed="true">EN</button></div>
      <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu" data-i18n-attr="aria-label:nav.menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;

export const footer = (prefix) => `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a class="brand" href="${prefix}index.html" aria-label="STUDIO N29">${logo()}<span>STUDIO N29</span></a>
      ${tx("p", "foot.tag")}
    </div>
    <div>
      <h4>Heroes Dawn</h4>
      <ul>
        <li><a href="${prefix}heroes-dawn.html#overview" data-i18n="sub.overview">${t("sub.overview")}</a></li>
        <li><a href="${prefix}heroes-dawn.html#lore" data-i18n="sub.lore">${t("sub.lore")}</a></li>
        <li><a href="${prefix}heroes-dawn.html#gameplay" data-i18n="sub.gameplay">${t("sub.gameplay")}</a></li>
        <li><a href="${prefix}heroes-dawn.html#agents" data-i18n="sub.agents">${t("sub.agents")}</a></li>
        <li><a href="${prefix}heroes-dawn.html#screens" data-i18n="sub.screens">${t("sub.screens")}</a></li>
        <li><a href="${prefix}heroes-dawn.html#roadmap" data-i18n="sub.roadmap">${t("sub.roadmap")}</a></li>
      </ul>
    </div>
    <div>
      ${tx("h4", "foot.studio")}
      <ul>
        <li><a href="${prefix}studio.html" data-i18n="nav.studio">${t("nav.studio")}</a></li>
        <li><a href="${prefix}hell-rising.html">Hell Rising</a></li>
        <li><a href="${prefix}portfolio.html" data-i18n="nav.portfolio">${t("nav.portfolio")}</a></li>
        <li><a href="${prefix}contact.html" data-i18n="nav.contact">${t("nav.contact")}</a></li>
      </ul>
    </div>
    <div>
      ${tx("h4", "foot.follow")}
      <ul>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li><a href="${LINKEDIN}" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a href="${MALT}" target="_blank" rel="noopener">Malt</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap foot-base">
    <span>© <span id="year">2026</span> STUDIO N29 — ${t("foot.rights")}</span>
    ${tx("span", "foot.nda")}
  </div>
</footer>`;

export const scripts = (prefix, { form = false, lightbox = false, filter = false, tabs = false, alpha = false } = {}) => {
  const s = (name) => `<script src="${prefix}${ver(`js/${name}.js`)}" defer></script>\n`;
  return `${s("i18n-data")}${s("i18n")}${s("ui")}${form ? s("form") : ""}${alpha ? s("alpha") : ""}${tabs ? s("tabs") : ""}${lightbox ? s("lightbox") : ""}${filter ? s("filter") : ""}</body>
</html>
`;
};

/** Responsive Heroes Dawn capture (1600 px + 800 px WebP). */
export const hdImg = (prefix, name, alt, { w = 1600, h = 900, sizes = "(max-width: 900px) 100vw, 50vw", lazy = true, altKey = "" } = {}) =>
  `<img src="${prefix}assets/heroes-dawn/${name}.webp" srcset="${prefix}assets/heroes-dawn/${name}-800.webp 800w, ${prefix}assets/heroes-dawn/${name}.webp 1600w" sizes="${sizes}" alt="${alt || (altKey ? t(altKey) : "")}"${altKey ? ` data-i18n-attr="alt:${altKey}"` : ""} width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ""} decoding="async">`;

export const card = (p, prefix = "") => {
  const badge = p.status ? `<span class="badge badge--${p.status}" data-i18n="status.${p.status}">${t("status." + p.status)}</span>` : "";
  return `<article class="card reveal${p.nda ? " card--nda" : ""}${p.featured ? " card--featured" : ""}" data-cat="${p.cat}">
        <div class="card-media${p.coverFit ? " card-media--contain" : ""}">${p.coverFit ? `<img class="card-bg" src="${prefix}assets/projects/${p.cover}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : ""}<img src="${prefix}assets/projects/${p.cover}" alt="${p.name}" loading="lazy" decoding="async" width="1200" height="750"></div>
        <div class="card-body">
          ${p.featured ? `<span class="eyebrow" data-i18n="projects.featured">${t("projects.featured")}</span>` : ""}
          <div class="card-meta">${tx("span", `p.${p.slug}.type`)}${badge}</div>
          <h3><a class="card-link" href="${projectHref(p, prefix)}">${p.name}</a></h3>
          ${tx("p", `p.${p.slug}.role`, "role")}
          ${tx("p", `p.${p.slug}.desc`)}
          <ul class="tags">${p.tech.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
      </article>`;
};

export const sectionHead = (eyebrowKey, titleKey, leadKey = "") => `<div class="section-head">
        ${tx("span", eyebrowKey, "eyebrow reveal")}
        ${tx("h2", titleKey, "section-title reveal")}
        ${leadKey ? tx("p", leadKey, "lead reveal", false, 'style="--d:.1s"') : ""}
      </div>`;
