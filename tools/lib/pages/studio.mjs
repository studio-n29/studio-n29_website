import { SITE, hdImages, t, tx } from "../data.mjs";
import { head, header, footer, scripts, sectionHead, logo, hdImg } from "../layout.mjs";
import { wishBanner } from "../sections.mjs";

export const render = () => {
  const p = "";
  const arrow = `<span class="arrow" aria-hidden="true">→</span>`;
  return `${head({ title: t("page.studio.title"), desc: t("page.studio.desc"), prefix: p, canonical: SITE + "/studio.html", page: "studio" })}
<body>
${header(p, "studio")}
<main id="main">
  <section class="page-head">
    <div class="wrap">
      ${tx("span", "s.eyebrow", "eyebrow")}
      ${tx("h1", "s.title", "page-title")}
      ${tx("p", "s.lead", "lead")}
    </div>
  </section>

  <section class="section section--tight" id="manifesto">
    <div class="wrap">
      <blockquote class="manifesto reveal">${tx("p", "s.manifesto")}</blockquote>
    </div>
  </section>

  <section class="section" id="philosophy" style="padding-top:1rem">
    <div class="wrap">
      ${sectionHead("s.phil.eyebrow", "s.phil.title")}
      <div class="skills-grid">
        ${[1, 2, 3, 4, 5, 6].map((n) => `<article class="skill reveal" style="--d:${((n - 1) % 3) * 0.08}s"><span class="idx">0${n}</span>${tx("h3", `s.p${n}.t`)}${tx("p", `s.p${n}.d`)}</article>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section section--cut" id="practice">
    <div class="wrap">
      ${sectionHead("s.prac.eyebrow", "s.prac.title")}
      <div class="split" style="margin-bottom:clamp(3rem,6vw,5rem)">
        <div class="split-media reveal">${hdImg(p, "combat", "", { altKey: "hd.cap.combat", sizes: "(max-width: 900px) 100vw, 640px" })}</div>
        <div class="split-text reveal" style="--d:.1s">
          ${tx("span", "s.hd.eyebrow", "eyebrow")}
          ${tx("h3", "s.hd.title", "section-title")}
          ${tx("p", "s.hd.text", "lead")}
          <a class="btn btn--ghost" href="heroes-dawn.html"><span data-i18n="h.feat.cta2">${t("h.feat.cta2")}</span>${arrow}</a>
        </div>
      </div>
      <div class="split split--rev">
        <div class="split-media reveal"><img src="assets/hell-rising/cendres.webp" srcset="assets/hell-rising/cendres-800.webp 800w, assets/hell-rising/cendres.webp 1600w" sizes="(max-width: 900px) 100vw, 640px" alt="${t("hr.cap1")}" data-i18n-attr="alt:hr.cap1" width="1600" height="900" loading="lazy" decoding="async"></div>
        <div class="split-text reveal" style="--d:.1s">
          ${tx("span", "s.hr.eyebrow", "eyebrow")}
          ${tx("h3", "s.hr.title", "section-title")}
          ${tx("p", "s.hr.text", "lead")}
          <a class="btn btn--ghost" href="hell-rising.html"><span data-i18n="hr.cta">${t("hr.cta")}</span>${arrow}</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="apex">
    <div class="wrap split">
      <div class="split-text reveal">
        ${tx("span", "s.apex.eyebrow", "eyebrow")}
        ${tx("h2", "s.apex.title", "section-title")}
        ${tx("p", "s.apex.p1", "lead")}
        ${tx("p", "s.apex.p2", "lead")}
        <a class="btn btn--ghost" href="heroes-dawn.html#lore"><span data-i18n="s.apex.lore">${t("s.apex.lore")}</span>${arrow}</a>
      </div>
      <div class="split-media reveal" style="--d:.1s"><img src="assets/heroes-dawn/art/place-rouge.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></div>
    </div>
  </section>

  <section class="section section--cut" id="team">
    <div class="wrap">
      ${sectionHead("s.team.eyebrow", "s.team.title")}
      <div class="studio-band" style="max-width:980px;margin-inline:auto">
        <div class="studio-mark reveal" aria-hidden="true">${logo()}</div>
        <div class="about-text reveal" style="--d:.1s">
          ${tx("h3", "s.founder.name", "block-title")}
          ${tx("p", "s.founder.p1", "", true)}
          ${tx("p", "s.founder.p2")}
          <p style="margin-top:1.6rem"><a class="btn btn--ghost btn--sm" href="portfolio.html"><span data-i18n="s.founder.cta">${t("s.founder.cta")}</span>${arrow}</a></p>
        </div>
      </div>
    </div>
  </section>

  ${wishBanner(p, { secondary: `<a class="btn btn--ghost" href="contact.html"><span data-i18n="nav.contact">${t("nav.contact")}</span>${arrow}</a>` })}
</main>
${footer(p)}
${scripts(p)}`;
};
