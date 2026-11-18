import { SITE, hdImages, t, tx } from "../data.mjs";
import { head, header, footer, scripts, hdImg, sectionHead, logo } from "../layout.mjs";
import { keyArtHero, featureTabs, agentsViewer, wishBanner } from "../sections.mjs";

const org = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "STUDIO N29", url: SITE + "/", logo: SITE + "/assets/apple-touch-icon.png",
      founder: { "@type": "Person", name: "Djason Nathiez" },
      address: { "@type": "PostalAddress", addressRegion: "Hauts-de-France", addressCountry: "FR" } },
    { "@type": "VideoGame", name: "Heroes Dawn", url: SITE + "/heroes-dawn.html", image: SITE + "/assets/projects/heroes-dawn/poster.jpg",
      genre: "Tactical management RPG", gamePlatform: ["Android", "iOS", "PC (Steam)"], datePublished: "2027-01-15", author: { "@type": "Organization", name: "STUDIO N29" } },
  ],
};

/** [image, i18n prefix, caption key] — the six feature tabs (home + Heroes Dawn page). */
export const FEATURES = [
  ["combat", "hd.f1", "combat"],
  ["plateau", "hd.f2", "board"],
  ["equipe", "hd.f3", "team"],
  ["qg", "hd.f4", "hq"],
  ["missions", "hd.f5", "missions"],
  ["minijeu", "hd.f6", "minigame"],
];

export const render = () => {
  const p = "";
  const strip = ["combat-sort", "plateau-brouillard", "fiche", "grimoire", "recrutement", "expeditions"];
  const thumb = (src) => `<img src="${src}" alt="" aria-hidden="true" width="248" height="140" loading="lazy" decoding="async">`;
  const dock = [
    ["heroes-dawn.html", hdImg(p, "combat", "", { w: 248, h: 140, sizes: "124px" }).replace('alt=""', 'alt="" aria-hidden="true"'), "dock.1.s", "dock.1.t"],
    ["hell-rising.html", thumb("assets/hell-rising/vue-jeu-800.webp"), "dock.2.s", "dock.2.t"],
    ["studio.html", hdImg(p, "equipe", "", { w: 248, h: 140, sizes: "124px" }).replace('alt=""', 'alt="" aria-hidden="true"'), "dock.3.s", "dock.3.t"],
  ];
  const dockHtml = `
    <div class="dock"><div class="wrap">
      ${dock.map(([href, img, s, ti]) => `<a class="dock-card" href="${href}">${img}<span>${tx("small", s)}${tx("strong", ti)}</span><span class="go" aria-hidden="true">→</span></a>`).join("\n      ")}
    </div></div>`;
  return `${head({ title: t("page.home.title"), desc: t("page.home.desc"), prefix: p, canonical: SITE + "/", page: "home",
    extra: `<script type="application/ld+json">${JSON.stringify(org)}</script>\n` })}
<body id="top">
${header(p, "")}
<main id="main">
  ${keyArtHero({ eyebrowKey: "h.feat.eyebrow", subKey: "h.feat.sub", dock: dockHtml,
    secondary: `<a class="btn btn--ghost" href="heroes-dawn.html"><span data-i18n="h.feat.cta2">${t("h.feat.cta2")}</span><span class="arrow" aria-hidden="true">→</span></a>` })}

  <section class="section" id="game">
    <div class="wrap">
      ${sectionHead("h.pillars.eyebrow", "h.pillars.title", "h.feat.text")}
      ${featureTabs(p, FEATURES)}
      <p class="more reveal"><a class="btn btn--ghost" href="heroes-dawn.html"><span data-i18n="h.feat.cta2">${t("h.feat.cta2")}</span><span class="arrow" aria-hidden="true">→</span></a></p>
    </div>
  </section>

  <section class="section section--cut" id="heroes">
    <div class="wrap">
      ${sectionHead("h.agents.eyebrow", "h.agents.title", "h.agents.lead")}
      ${agentsViewer(p)}
    </div>
  </section>

  <section class="section" id="universe">
    <div class="wrap split">
      <div class="split-text reveal">
        ${tx("span", "s.apex.eyebrow", "eyebrow")}
        ${tx("h2", "s.apex.title", "section-title")}
        ${tx("p", "s.apex.p1", "lead")}
        <a class="btn btn--ghost" href="studio.html#apex"><span data-i18n="h.apex.cta">${t("h.apex.cta")}</span><span class="arrow" aria-hidden="true">→</span></a>
      </div>
      <div class="split-media reveal" style="--d:.1s"><img src="assets/heroes-dawn/art/porte-des-enfers.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></div>
    </div>
  </section>

  <section class="section section--cut" id="shots">
    <div class="wrap">
      ${sectionHead("h.shots.eyebrow", "h.shots.title")}
    </div>
    <div class="strip" tabindex="0" role="group" aria-label="Heroes Dawn">
      ${strip.map((n) => `<a class="strip-item" href="heroes-dawn.html#screens" tabindex="-1">${hdImg(p, n, "", { altKey: `hd.cap.${hdImages.find((x) => x.name === n).cap}`, sizes: "(max-width: 700px) 85vw, 640px" })}</a>`).join("\n      ")}
    </div>
    <p class="more reveal"><a class="btn btn--ghost" href="heroes-dawn.html#screens"><span data-i18n="h.shots.cta">${t("h.shots.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></p>
  </section>

  ${wishBanner(p)}

  <section class="teaser" id="hell-rising">
    <img class="teaser-bg" src="assets/hell-rising/cendres.webp" srcset="assets/hell-rising/cendres-800.webp 800w, assets/hell-rising/cendres.webp 1600w" sizes="100vw" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <div class="wrap">
      ${tx("span", "hr.eyebrow", "eyebrow reveal")}
      <h2 class="teaser-title reveal">Hell Rising</h2>
      ${tx("p", "hr.tag", "lead reveal")}
      <ul class="chips teaser-chips reveal"><li data-i18n="hr.c1">${t("hr.c1")}</li><li data-i18n="hr.c2">${t("hr.c2")}</li><li data-i18n="hr.c3">${t("hr.c3")}</li></ul>
      <p class="more reveal"><a class="btn btn--ghost" href="hell-rising.html"><span data-i18n="hr.cta">${t("hr.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></p>
    </div>
  </section>

  <section class="section" id="studio">
    <div class="wrap studio-band">
      <div class="studio-mark reveal" aria-hidden="true">${logo()}</div>
      <div class="reveal" style="--d:.1s">
        ${tx("span", "h.studio.eyebrow", "eyebrow")}
        ${tx("h2", "h.studio.title", "section-title")}
        ${tx("p", "h.studio.text", "lead")}
        <p style="margin-top:2rem"><a class="btn btn--ghost" href="studio.html"><span data-i18n="h.studio.cta">${t("h.studio.cta")}</span><span class="arrow" aria-hidden="true">→</span></a></p>
      </div>
    </div>
  </section>
</main>
${footer(p)}
${scripts(p, { tabs: true })}`;
};
