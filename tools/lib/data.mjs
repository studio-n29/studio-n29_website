// Shared data + i18n helpers for the site generator.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), "utf8"));

export const SITE = "https://n29-studio.fr";
export const EMAIL = "dm.nathiez@gmail.com";
export const MALT = "https://www.malt.fr/profile/djasonnathiez";
export const LINKEDIN = "https://www.linkedin.com/in/djason-nathiez-391b2b365";
export const ACCESS_KEY = "2061a5e7-2cc7-434f-b98f-9d11cdc1b6da"; // Web3Forms public key (client-side by design)

/** Steam store page of Heroes Dawn. Leave empty until the page exists: the wishlist button then shows "Coming soon on Steam". */
export const STEAM_URL = "";

// i18n: i18n/{en,fr}.json hold the original keys; i18n/{en,fr}.studio.json hold the studio-site keys (they override).
export const fr = { ...read("i18n/fr.json"), ...read("i18n/fr.studio.json") };
export const en = { ...read("i18n/en.json"), ...read("i18n/en.studio.json") };
export const t = (k) => {
  if (!(k in en)) throw new Error(`Missing i18n key (en): ${k}`);
  if (!(k in fr)) throw new Error(`Missing i18n key (fr): ${k}`);
  return en[k];
};
/** Element with translatable text. html=true allows markup in the value. */
export const tx = (tag, key, cls = "", html = false, extra = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""}${extra ? " " + extra : ""} ${html ? "data-i18n-html" : "data-i18n"}="${key}">${t(key)}</${tag}>`;

const hdManifest = read("assets/heroes-dawn/manifest.json");
/** In-game captures (build 1.0.2): [{ name, w, h, cap }] */
export const hdImages = hdManifest.shots;
/** Illustrations: [{ slug, label, kind: "agent" | "cryptid" | "place", w, h }] */
export const hdArts = hdManifest.arts;

const m = (slug, list) => list.map(([f, w, h]) => ({ src: `${slug}/${f}`, w, h }));
// Animated WebP clips (get a "gameplay" badge in the galleries)
export const ANIM = new Set(["beat-strike/08.webp",
  ...["01", "02", "03", "04", "05"].map((n) => `discosmos/${n}.webp`), ...["01", "02", "03", "04", "05", "06", "07"].map((n) => `delight/${n}.webp`),
  "sweet-courrier/03.webp", "sweet-courrier/05.webp", "sweet-courrier/06.webp"]);

/** cat: "game" | "tool". href overrides the default projects/<slug>.html (Heroes Dawn has its own page). */
export const PROJECTS = [
  { slug: "heroes-dawn", name: "Heroes Dawn", href: "heroes-dawn.html", cover: "heroes-dawn/poster.jpg", cat: "game", engine: "Unity 6", tech: ["Unity 6", "C#", "Clean architecture", "Editor tools"], status: "wip", featured: true },
  { slug: "discosmos", name: "Discosmos", cover: "discosmos/03.webp", cat: "game", engine: "Unity (URP)", tech: ["Unity", "C#", "Photon", "Netcode"], c: 4,
    media: m("discosmos", [["06.webp", 1326, 2048], ["01.webp", 512, 394], ["02.webp", 512, 364], ["03.webp", 512, 353], ["04.webp", 527, 445], ["05.webp", 601, 513]]) },
  { slug: "beat-strike", name: "Beat Strike", cover: "beat-strike/07.webp", coverFit: "contain", cat: "game", engine: "Unity 2021 LTS", tech: ["Unity", "C#", "Editor tools", "Rhythm engine"], c: 5,
    media: m("beat-strike", [["01.webp", 1913, 1011], ["04.webp", 1253, 711], ["02.webp", 279, 635], ["03.webp", 296, 239], ["05.webp", 294, 284], ["06.webp", 512, 503], ["07.webp", 362, 646], ["08.webp", 294, 640]]) },
  { slug: "delight", name: "Delight", cover: "delight/03.webp", cat: "game", engine: "Unity 6", tech: ["Unity 6", "C#", "FSM AI", "Audio"], c: 5,
    video: "https://www.youtube.com/watch?v=Ls7xzg5Ivjg",
    media: m("delight", [["07.webp", 1124, 554], ["01.webp", 890, 490], ["02.webp", 512, 408], ["03.webp", 512, 309], ["04.webp", 638, 508], ["05.webp", 512, 224], ["06.webp", 638, 508]]) },
  { slug: "sweet-courrier", name: "Sweet Courrier", cover: "sweet-courrier/05.webp", cat: "game", engine: "Unity", tech: ["Unity", "C#", "Physics", "Local co-op"], c: 3,
    media: m("sweet-courrier", [["02.webp", 512, 304], ["03.webp", 512, 272], ["04.webp", 667, 211], ["05.webp", 612, 442], ["06.webp", 512, 272]]) },
  { slug: "n29-hq", name: "N29 HQ", cover: "n29-hq/01.webp", cat: "tool", engine: "Web app (PWA)", tech: ["JavaScript", "WebCrypto", "Supabase", "PWA"], c: 5,
    media: m("n29-hq", [["01.webp", 1280, 860], ["02.webp", 1280, 860], ["03.webp", 1280, 860], ["04.webp", 1280, 860], ["05.webp", 1280, 860], ["06.webp", 1280, 860], ["07.webp", 390, 844], ["08.webp", 390, 844]]) },
  { slug: "project-x", name: "Project X", cover: "project-x-cover.svg", cat: "game", engine: "Unity", tech: ["Unity", "C#"], c: 3, status: "nda", nda: true },
];
export const projectHref = (p, prefix) => `${prefix}${p.href || `projects/${p.slug}.html`}`;
