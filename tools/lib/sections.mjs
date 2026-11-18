// Page sections shared by the home page and the Heroes Dawn page.
import { hdArts, t, tx } from "./data.mjs";
import { hdImg, wishlist } from "./layout.mjs";

/** Key-art hero: clean illustration + wordmark logo (Aube Tactique identity). `dock` is appended by the caller. */
export const keyArtHero = ({ eyebrowKey, subKey, secondary, page = false, dock = "" }) => `<section class="hero-main${page ? " hero-main--page" : ""}">
    <div class="hero-stage">
      <img class="hero-key" src="assets/heroes-dawn/keyart.webp" srcset="assets/heroes-dawn/keyart-960.webp 960w, assets/heroes-dawn/keyart.webp 1672w" sizes="100vw" alt="" width="1672" height="941" fetchpriority="high">
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-copy"><div class="wrap"><div class="inner">
        <div class="hero-meta">
          ${tx("span", eyebrowKey, "eyebrow intro", false, 'style="--d:.15s"')}
          <h1 class="hero-logo intro" style="--d:.25s"><img src="assets/heroes-dawn/logo.png" alt="Heroes Dawn" width="1280" height="179"></h1>
          ${tx("p", subKey, "hero-sub intro", false, 'style="--d:.4s"')}
          ${tx("p", "hd.release.line", "hero-date intro", false, 'style="--d:.48s"')}
        </div>
        <div class="hero-cta intro" style="--d:.55s">
          ${wishlist()}
          ${secondary}
        </div>
      </div></div></div>
    </div>${dock}
  </section>`;

/** Feature viewer: vertical tab list + big screenshot panel. features = [[image, i18n prefix, caption key], ...] */
export const featureTabs = (prefix, features, id = "feat") => `<div class="tabs reveal" data-tabs>
        <div class="tab-list" role="tablist" aria-orientation="vertical">
          ${features.map(([, k], i) => `<button type="button" class="tab" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}"><span class="idx">0${i + 1}</span><span data-i18n="${k}.t">${t(`${k}.t`)}</span></button>`).join("\n          ")}
        </div>
        <div class="tab-panels">
          ${features.map(([img, k, cap], i) => `<article class="tab-panel" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}">
            <div class="panel-media">${hdImg(prefix, img, "", { altKey: `hd.cap.${cap}`, sizes: "(max-width: 1060px) 100vw, 880px" })}</div>
            <div class="panel-text">${tx("h3", `${k}.t`)}${tx("p", `${k}.d`)}</div>
          </article>`).join("\n          ")}
        </div>
      </div>`;

/** Character viewer: big illustration (name caption) + thumbnail selector. Agents first, then cryptids. */
export const agentsViewer = (prefix) => {
  const list = hdArts.filter((a) => a.kind === "agent" || a.kind === "cryptid");
  const art = (a, size) => `${prefix}assets/heroes-dawn/art/${a.slug}${size}.webp`;
  return `<div class="agents-viewer reveal" data-tabs>
        <div class="agent-stage">
          ${list.map((a, i) => `<figure class="agent-panel" role="tabpanel" id="ag-p${i}" aria-labelledby="ag-t${i}"><img src="${art(a, "")}" srcset="${art(a, "-800")} 800w, ${art(a, "")} ${a.w}w" sizes="(max-width: 1240px) 100vw, 1240px" alt="${a.label}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async"><figcaption><small data-i18n="hd.art.${a.kind}">${t(`hd.art.${a.kind}`)}</small><b>${a.label}</b></figcaption></figure>`).join("\n          ")}
        </div>
        <div class="thumbs" role="tablist" aria-label="Heroes Dawn">
          ${list.map((a, i) => `<button type="button" class="thumb" role="tab" id="ag-t${i}" aria-controls="ag-p${i}" aria-selected="${i === 0}" aria-label="${a.label}"><img src="${art(a, "-800")}" alt="" width="800" height="${Math.round((a.h * 800) / a.w)}" loading="lazy" decoding="async"></button>`).join("\n          ")}
        </div>
      </div>`;
};

/** Full-width closing banner with the wishlist call to action. */
export const wishBanner = (prefix, { id = "wishlist", secondary = "" } = {}) => `<section class="banner" id="${id}">
    <img class="banner-bg" src="${prefix}assets/heroes-dawn/art/porte-des-enfers.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <div class="wrap">
      ${tx("span", "hd.cta.eyebrow", "eyebrow reveal")}
      ${tx("h2", "hd.cta.title", "section-title reveal")}
      ${tx("p", "hd.cta.lead", "lead reveal")}
      <div class="hero-cta reveal">${wishlist()}${secondary}</div>
    </div>
  </section>`;
