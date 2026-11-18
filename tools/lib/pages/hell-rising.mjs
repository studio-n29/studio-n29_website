// Hell Rising: teaser page. The project has just started, so this page deliberately says very little.
import { SITE, t, tx } from "../data.mjs";
import { head, header, footer, scripts, sectionHead } from "../layout.mjs";

export const render = () => {
  const p = "";
  const img = (name, key, sizes = "(max-width: 900px) 100vw, 50vw") =>
    `<img src="assets/hell-rising/${name}.webp" srcset="assets/hell-rising/${name}-800.webp 800w, assets/hell-rising/${name}.webp 1600w" sizes="${sizes}" alt="${t(key)}" data-i18n-attr="alt:${key}" width="1600" height="900" loading="lazy" decoding="async">`;
  return `${head({ title: t("page.hr.title"), desc: t("page.hr.desc"), prefix: p, canonical: SITE + "/hell-rising.html", page: "hr", image: `${SITE}/assets/hell-rising/cendres.webp` })}
<body>
${header(p, "")}
<main id="main">
  <section class="teaser teaser--page">
    <img class="teaser-bg" src="assets/hell-rising/cendres.webp" srcset="assets/hell-rising/cendres-800.webp 800w, assets/hell-rising/cendres.webp 1600w" sizes="100vw" alt="" aria-hidden="true" fetchpriority="high">
    <div class="wrap">
      ${tx("span", "hr.eyebrow", "eyebrow intro", false, 'style="--d:.1s"')}
      <h1 class="teaser-title intro" style="--d:.25s">Hell Rising</h1>
      ${tx("p", "hr.tag", "lead intro", false, 'style="--d:.4s"')}
      <ul class="chips teaser-chips intro" style="--d:.55s"><li data-i18n="hr.c1">${t("hr.c1")}</li><li data-i18n="hr.c2">${t("hr.c2")}</li><li data-i18n="hr.c3">${t("hr.c3")}</li></ul>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${sectionHead("hr.p.eyebrow", "hr.p.title", "hr.p.lead")}
      <div class="skills-grid">
        ${[1, 2, 3].map((n) => `<article class="skill reveal" style="--d:${(n - 1) * 0.08}s"><span class="idx">0${n}</span>${tx("h3", `hr.i${n}.t`)}${tx("p", `hr.i${n}.d`)}</article>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section section--cut">
    <div class="wrap">
      ${sectionHead("hr.v.eyebrow", "hr.v.title", "hr.v.lead")}
      <div class="duo">
        <figure class="duo-item frame reveal">${img("cendres", "hr.cap1")}<figcaption data-i18n="hr.cap1">${t("hr.cap1")}</figcaption></figure>
        <figure class="duo-item frame reveal" style="--d:.1s">${img("vue-jeu", "hr.cap2")}<figcaption data-i18n="hr.cap2">${t("hr.cap2")}</figcaption></figure>
      </div>
      ${tx("p", "hr.note", "teaser-note reveal")}
    </div>
  </section>

  <section class="section">
    <div class="wrap"><div class="next reveal">${tx("h2", "hr.follow")}<a class="btn btn--solid" href="contact.html"><span data-i18n="hr.follow.cta">${t("hr.follow.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></div></div>
  </section>
</main>
${footer(p)}
${scripts(p)}`;
};
