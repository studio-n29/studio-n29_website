import { SITE, PROJECTS, ANIM, projectHref, t, tx } from "../data.mjs";
import { head, header, footer, scripts, card } from "../layout.mjs";

export const render = (pr) => {
  const p = "../";
  const k = (s) => `p.${pr.slug}.${s}`;
  const badge = pr.status ? `<span class="badge badge--${pr.status}" data-i18n="status.${pr.status}">${t("status." + pr.status)}</span>` : "";
  const contrib = Array.from({ length: pr.c }, (_, i) => `<li data-i18n-html="${k("c" + (i + 1))}">${t(k("c" + (i + 1)))}</li>`).join("\n            ");
  const others = PROJECTS.filter((x) => x.slug !== pr.slug && !x.featured).slice(0, 3);
  const title = t("meta.title.project").replace("{name}", pr.name);
  return `${head({ title, desc: t(k("tagline")), prefix: p, canonical: `${SITE}/projects/${pr.slug}.html`, image: `${SITE}/assets/projects/${pr.cover}`,
    htmlAttrs: ` data-project="${pr.slug}" data-project-name="${pr.name}"` })}
<body>
${header(p, "portfolio")}
<main id="main">
  <section class="p-hero">
    <div class="wrap">
      <a class="back" href="../portfolio.html#projects"><span aria-hidden="true">←</span><span data-i18n="pg.back">${t("pg.back")}</span></a>
      <div style="margin-top:1.8rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><span class="eyebrow" data-i18n="${k("type")}">${t(k("type"))}</span>${badge}</div>
      <h1>${pr.name}</h1>
      ${tx("p", k("tagline"), "tagline")}
    </div>
  </section>
  ${pr.media ? `<section class="shots"><div class="wrap">
    <div class="gallery" data-gallery>${pr.media.map((x, i) => `<button type="button" class="shot reveal${ANIM.has(x.src) ? " shot--anim" : ""}" style="--d:${(i % 3) * 0.07}s" aria-label="${t("pg.zoom")}" data-i18n-attr="aria-label:pg.zoom"><img src="../assets/projects/${x.src}" alt="${pr.name} — ${i + 1}" width="${x.w}" height="${x.h}" loading="lazy" decoding="async"></button>`).join("")}</div>
    ${pr.video ? `<p style="margin-top:1.5rem"><a class="btn btn--ghost btn--sm" href="${pr.video}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span><span data-i18n="pg.watch">${t("pg.watch")}</span></a></p>` : ""}
  </div></section>` : `<div class="p-cover reveal"><img src="../assets/projects/${pr.cover}" alt="${pr.name}" width="1600" height="900"></div>`}
  <section class="section" style="padding-top:3rem">
    <div class="wrap">
      <div class="p-meta">
        <div>${tx("small", "pg.role")}${tx("span", k("meta.role"))}</div>
        <div>${tx("small", "pg.engine")}<span>${pr.engine}</span></div>
        <div>${tx("small", "pg.team")}${tx("span", k("meta.team"))}</div>
        <div>${tx("small", "pg.tech")}<span>${pr.tech.slice(0, 3).join(" Â· ")}</span></div>
      </div>
      <div style="height:clamp(3rem,7vw,6rem)"></div>
      ${pr.nda ? `<div class="notice reveal" style="margin-bottom:3rem" data-i18n="${k("notice")}">${t(k("notice"))}</div>` : ""}
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
        <a class="btn btn--solid" href="../contact.html"><span data-i18n="pg.next.cta">${t("pg.next.cta")}</span><span class="arrow" aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="reveal">${tx("span", "pg.more", "eyebrow")}</div>
      <div class="projects-grid" style="margin-top:2rem">
        ${others.map((o) => card(o, p)).join("\n        ")}
      </div>
    </div>
  </section>
</main>
${footer(p)}
${scripts(p, { lightbox: !!pr.media })}`;
};

/** projects/heroes-dawn.html now lives at /heroes-dawn.html */
export const redirect = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Heroes Dawn — STUDIO N29</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/heroes-dawn.html">
<meta http-equiv="refresh" content="0; url=../heroes-dawn.html"></head>
<body><p><a href="../heroes-dawn.html">Heroes Dawn</a></p></body></html>
`;
