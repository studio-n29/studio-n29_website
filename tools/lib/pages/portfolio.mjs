// Portfolio: the professional work of Djason Nathiez (projects, skills, journey, review). Kept apart from the studio pages.
import { SITE, MALT, PROJECTS, t, tx } from "../data.mjs";
import { head, header, footer, scripts, card } from "../layout.mjs";

const skills = [
  ["01", ["C#", "Unity", "State machines", "ScriptableObjects", "Game feel"]],
  ["02", ["Photon", "RPC", "State sync", "Rooms"]],
  ["03", ["Editor scripting", "Custom inspectors", "Data-driven"]],
  ["04", ["Object pooling", "Addressables", "Serialization", "Design patterns"]],
  ["05", ["TypeScript", "Python", "Neo4j", "SQL / NoSQL", "Dart"]],
  ["06", ["Git", "Google Cloud", "Blender", "Unreal Engine", "C++"]],
];

export const render = () => {
  const p = "";
  const filters = [["all", "g.f.all"], ["game", "g.f.game"], ["tool", "g.f.tool"]];
  const person = {
    "@context": "https://schema.org", "@type": "Person", name: "Djason Nathiez", jobTitle: "Unity Gameplay Programmer", url: SITE + "/portfolio.html",
    worksFor: { "@type": "Organization", name: "STUDIO N29", url: SITE + "/" }, sameAs: [MALT],
    knowsAbout: ["Unity", "C#", "Gameplay programming", "Multiplayer networking", "Photon", "Editor tooling"],
  };
  return `${head({ title: t("page.portfolio.title"), desc: t("page.portfolio.desc"), prefix: p, canonical: SITE + "/portfolio.html", page: "portfolio",
    extra: `<script type="application/ld+json">${JSON.stringify(person)}</script>\n` })}
<body>
${header(p, "portfolio")}
<main id="main">
  <section class="page-head">
    <div class="wrap">
      ${tx("span", "pf.eyebrow", "eyebrow")}
      ${tx("h1", "pf.title", "page-title")}
      ${tx("p", "pf.lead", "lead")}
      <p style="margin-top:2rem"><a class="btn btn--solid" href="contact.html"><span data-i18n="pf.cta">${t("pf.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></p>
    </div>
  </section>

  <section class="section" style="padding-top:2rem">
    <div class="wrap">
      <div class="pf-section" id="projects">
        <h2 class="pf-title" data-i18n="pf.projects">${t("pf.projects")}</h2>
        <div class="filters" role="group" aria-label="Filter" style="margin:0 0 2rem">
          ${filters.map(([id, key], i) => `<button type="button" class="chip-btn" data-filter="${id}" aria-pressed="${i === 0}" data-i18n="${key}">${t(key)}</button>`).join("\n          ")}
        </div>
        <div class="projects-grid" id="grid">
        ${PROJECTS.map((x) => card(x, p)).join("\n        ")}
        </div>
      </div>

      <div class="pf-section" id="skills">
        <h2 class="pf-title" data-i18n="pf.skills">${t("pf.skills")}</h2>
        <div class="skills-grid">
          ${skills.map(([n, chips], i) => `<article class="skill reveal" style="--d:${(i % 3) * 0.08}s">
            <span class="idx">${n}</span>
            ${tx("h3", `skills.${i + 1}.t`)}
            ${tx("p", `skills.${i + 1}.d`)}
            <ul class="chips">${chips.map((c) => `<li>${c}</li>`).join("")}</ul>
          </article>`).join("\n          ")}
        </div>
      </div>

      <div class="pf-section" id="journey">
        <h2 class="pf-title" data-i18n="pf.journey">${t("pf.journey")}</h2>
        <div class="timeline" style="margin-top:0">
          ${[1, 2, 3, 4].map((n) => `<div class="t-item reveal">
            ${tx("div", `journey.${n}.date`, "t-date")}
            <div><h3>${tx("span", `journey.${n}.t`)}<small data-i18n="journey.${n}.o">${t(`journey.${n}.o`)}</small></h3>${tx("p", `journey.${n}.d`)}</div>
          </div>`).join("\n          ")}
        </div>
      </div>

      <div class="pf-section" id="reviews">
        <h2 class="pf-title" data-i18n="pf.reviews">${t("pf.reviews")}</h2>
        <div class="reviews">
          <figure class="review reveal">
            <div class="stars" role="img" aria-label="5 / 5"><span aria-hidden="true">★★★★★</span></div>
            <blockquote data-i18n="reviews.quote">${t("reviews.quote")}</blockquote>
            <figcaption>
              <span class="avatar" aria-hidden="true">Z</span>
              <span><strong>Zahid</strong>${tx("small", "reviews.role")}</span>
            </figcaption>
            <p class="review-meta mono">${tx("span", "reviews.date")} · Malt</p>
          </figure>
          <aside class="rating reveal" style="--d:.1s">
            <b>${t("reviews.rating")}<small> / 5</small></b>
            ${tx("span", "reviews.count", "mono")}
            <a class="btn btn--solid btn--sm" href="${MALT}" target="_blank" rel="noopener"><span data-i18n="reviews.cta">${t("reviews.cta")}</span><span class="arrow" aria-hidden="true">↗</span></a>
            ${tx("p", "reviews.note", "review-note")}
          </aside>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--cut">
    <div class="wrap"><div class="next reveal">${tx("h2", "pg.next.title")}<a class="btn btn--solid" href="contact.html"><span data-i18n="pg.next.cta">${t("pg.next.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></div></div>
  </section>
</main>
${footer(p)}
${scripts(p, { filter: true })}`;
};
