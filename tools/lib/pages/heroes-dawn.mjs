import { SITE, hdImages, t, tx } from "../data.mjs";
import { head, header, footer, scripts, hdImg, sectionHead } from "../layout.mjs";
import { keyArtHero, featureTabs, agentsViewer, alphaSection, wishBanner } from "../sections.mjs";
import { FEATURES } from "./home.mjs";

export const render = () => {
  const p = "";
  const game = {
    "@context": "https://schema.org", "@type": "VideoGame", name: "Heroes Dawn", url: SITE + "/heroes-dawn.html",
    image: SITE + "/assets/projects/heroes-dawn/poster.jpg", description: t("page.hd.desc"), genre: "Tactical management RPG",
    gamePlatform: ["Android", "iOS", "PC (Steam)"], datePublished: "2027-01-15", applicationCategory: "Game", author: { "@type": "Organization", name: "STUDIO N29", url: SITE + "/" },
  };
  const sub = [["overview", "sub.overview"], ["lore", "sub.lore"], ["gameplay", "sub.gameplay"], ["agents", "sub.agents"], ["screens", "sub.screens"], ["roadmap", "sub.roadmap"], ["alpha", "sub.alpha"]];
  return `${head({ title: t("page.hd.title"), desc: t("page.hd.desc"), prefix: p, canonical: SITE + "/heroes-dawn.html", page: "hd",
    extra: `<script type="application/ld+json">${JSON.stringify(game)}</script>\n`, image: `${SITE}/assets/projects/heroes-dawn/poster.jpg` })}
<body>
${header(p, "heroes")}
<main id="main">
  ${keyArtHero({ page: true, eyebrowKey: "hd.hero.eyebrow", subKey: "hd.hero.tag",
    secondary: `<a class="btn btn--ghost" href="#screens"><span data-i18n="hd.hero.cta2">${t("hd.hero.cta2")}</span><span class="arrow" aria-hidden="true">↓</span></a>` })}

  <nav class="subnav" aria-label="Heroes Dawn"><div class="wrap">
    ${sub.map(([id, key]) => `<a href="#${id}" data-i18n="${key}">${t(key)}</a>`).join("\n    ")}
  </div></nav>

  <section class="section" id="overview">
    <div class="wrap">
      ${sectionHead("hd.about.eyebrow", "hd.about.title")}
      <div class="about-grid" style="max-width:1000px;margin-inline:auto">
        <div class="about-text reveal">${tx("p", "hd.about.p1")}</div>
        <div class="about-text reveal" style="--d:.1s">${tx("p", "hd.about.p2")}</div>
      </div>
      <div class="spec reveal">
        <div>${tx("small", "hd.m.genre")}${tx("span", "hd.m.genre.v")}</div>
        <div>${tx("small", "hd.m.platform")}${tx("span", "hd.m.platform.v")}</div>
        <div>${tx("small", "hd.m.engine")}<span>Unity 6 · C#</span></div>
        <div>${tx("small", "hd.m.status")}${tx("span", "hd.m.status.v")}</div>
      </div>
    </div>
  </section>

  <section class="section section--cut" id="lore">
    <div class="wrap">
      ${sectionHead("lore.eyebrow", "lore.title", "lore.lead")}
      <ol class="lore-line">
        ${[1, 2, 3].map((n) => `<li class="lore-step reveal" style="--d:${(n - 1) * 0.1}s"><b class="lore-year" data-i18n="lore.t${n}.y">${t(`lore.t${n}.y`)}</b>${tx("h3", `lore.t${n}.t`)}${tx("p", `lore.t${n}.d`)}</li>`).join("\n        ")}
      </ol>
      <div class="skills-grid" style="margin-top:3rem">
        ${[1, 2, 3].map((n) => `<article class="skill reveal" style="--d:${(n - 1) * 0.08}s">${tx("h3", `lore.c${n}.t`)}${tx("p", `lore.c${n}.d`)}</article>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section" id="gameplay">
    <div class="wrap">
      ${sectionHead("hd.feat.eyebrow", "hd.feat.title")}
      ${featureTabs(p, FEATURES)}
    </div>
  </section>

  <section class="section section--cut" id="agents">
    <div class="wrap">
      ${sectionHead("h.agents.eyebrow", "h.agents.title", "h.agents.lead")}
      ${agentsViewer(p)}
    </div>
  </section>

  <section class="section" id="screens">
    <div class="wrap">
      ${sectionHead("hd.gal.eyebrow", "hd.gal.title", "hd.gal.lead")}
      <div class="gallery gallery--grid" data-gallery>
        ${hdImages.map((x, i) => `<button type="button" class="shot reveal" style="--d:${(i % 3) * 0.07}s" aria-label="${t("pg.zoom")}" data-i18n-attr="aria-label:pg.zoom">${hdImg(p, x.name, "", { w: x.w, h: x.h, altKey: `hd.cap.${x.cap}`, sizes: "(max-width: 700px) 100vw, 33vw" })}</button>`).join("")}
      </div>
    </div>
  </section>

  <section class="section" id="roadmap">
    <div class="wrap">
      ${sectionHead("hd.road.eyebrow", "hd.road.title", "hd.road.lead")}
      <ol class="roadmap">
        ${[1, 2].map((n) => `<li class="road-step reveal${n === 2 ? " is-now" : ""}" style="--d:${(n - 1) * 0.1}s">${tx("small", `hd.road.${n}.s`)}${tx("h3", `hd.road.${n}.t`)}${tx("p", `hd.road.${n}.d`)}</li>`).join("\n        ")}
      </ol>
    </div>
  </section>

  <section class="section section--cut" id="tech">
    <div class="wrap about-grid">
      <div class="reveal">${tx("span", "hd.tech.eyebrow", "eyebrow")}${tx("h2", "hd.tech.title", "section-title")}</div>
      <div class="about-text reveal" style="--d:.1s">
        ${tx("p", "hd.tech.p", "", true)}
        <ul class="chips">${["Unity 6", "C#", "MVP", "VContainer", "MessagePipe", "UniTask", "EditMode / PlayMode tests", "Editor tools", "Supabase-ready"].map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
    </div>
  </section>

  ${alphaSection()}

  ${wishBanner(p, { secondary: `<a class="btn btn--ghost" href="contact.html"><span data-i18n="hd.cta.press">${t("hd.cta.press")}</span><span class="arrow" aria-hidden="true">→</span></a>` })}
</main>
${footer(p)}
${scripts(p, { lightbox: true, tabs: true, alpha: true })}`;
};
