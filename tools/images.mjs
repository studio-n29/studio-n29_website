// Imports the Heroes Dawn visuals (build 1.0.2, "Aube Tactique" identity) as optimised WebP into assets/heroes-dawn/.
// Run: npm run images   (needs the game repository at HD_ROOT; the generated files are committed, so this is only for refreshes)
import sharp from "sharp";
import { mkdirSync, writeFileSync, statSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HD = process.env.HD_ROOT || "E:/Projets/HeroesDawn";
const PUB = `${HD}/publication-aube-tactique`;
const ART = `${HD}/principal/03_Art_UI_UX/Illustrations`;
const OUT = join(ROOT, "assets/heroes-dawn");

// In-game captures (real Unity render, Aube Tactique UI). [name, source, caption key suffix]
export const SHOTS = [
  ["combat", `${PUB}/captures-release/04-combat.png`, "combat"],
  ["combat-sort", `${PUB}/captures-release/04b-combat-animation.png`, "combat2"],
  ["plateau", `${PUB}/captures-release/03-plateau.png`, "board"],
  ["plateau-brouillard", `${PUB}/captures-pc/03c-plateau-brouillard.png`, "fog"],
  ["qg", `${PUB}/captures-pc/10b-qg-sans-tuto.png`, "hq"],
  ["missions", `${PUB}/steam/screenshots/03-missions_1920x1080.png`, "missions"],
  ["equipe", `${PUB}/steam/screenshots/01-equipe_1920x1080.png`, "team"],
  ["fiche", `${PUB}/steam/screenshots/02-agent_1920x1080.png`, "sheet"],
  ["grimoire", `${PUB}/captures-pc/16-grimoire.png`, "grimoire"],
  ["recrutement", `${PUB}/steam/screenshots/06-recrutement_1920x1080.png`, "recruit"],
  ["atelier", `${PUB}/steam/screenshots/04-atelier_1920x1080.png`, "craft"],
  ["expeditions", `${PUB}/steam/screenshots/05-expeditions_1920x1080.png`, "expeditions"],
  ["minijeu", `${PUB}/captures-brutes/99-minijeu-rythme.png`, "minigame"],
  ["minijeu-infiltration", `${PUB}/captures-brutes/96-minijeu-infiltration.png`, "stealth"],
  ["pass", `${PUB}/captures-pc/40-pass.png`, "pass"],
  ["boutique", `${PUB}/captures-pc/50b-boutique-boosters.png`, "shop"],
];

// Illustrations from the game's art production. [slug, display name, kind, source file]
export const ARTS = [
  ["giulia-rossi", "Giulia Rossi", "agent", "Agents/giulia_rossi.jpg"],
  ["ilona-varga", "Ilona Varga", "agent", "Agents/ilona_varga.jpg"],
  ["lucas-mendes", "Lucas Mendes", "agent", "Agents/lucas_mendes.jpg"],
  ["mei-lin-chen", "Mei-Lin Chen", "agent", "Agents/mei_lin_chen.jpg"],
  ["kwame-abara", "Kwame Abara", "agent", "Agents/kwame_abara.jpg"],
  ["freya-lindqvist", "Freya Lindqvist", "agent", "Agents/freya_lindqvist.jpg"],
  ["yelena-ivanova", "Yelena Ivanova", "agent", "Agents/yelena_ivanova.jpg"],
  ["sam-okafor", "Sam Okafor", "agent", "Agents/sam_okafor.jpg"],
  ["rin-takeda", "Rin Takeda", "agent", "Agents/rin_takeda.jpg"],
  ["odile-ferrand", "Odile Ferrand", "agent", "Agents/odile_ferrand.jpg"],
  ["ada-okonkwo", "Ada Okonkwo", "agent", "Agents/ada_okonkwo.jpg"],
  ["haruto-nakamura", "Haruto Nakamura", "agent", "Agents/haruto_nakamura.jpg"],
  ["kraken", "Kraken", "cryptid", "Ennemis_Cryptides/cryptide_s1_kraken.jpg"],
  ["phalene", "Phalène", "cryptid", "Ennemis_Cryptides/cryptide_s4_phalene.jpg"],
  ["famine", "Famine", "cryptid", "Ennemis_Cryptides/cryptide_s5_famine.jpg"],
  ["lupin", "Lupin", "cryptid", "Ennemis_Cryptides/cryptide_s7_lupin.jpg"],
  ["porte-des-enfers", "Paris", "place", "Lieux/paris_porte_des_enfers.jpg"],
  ["place-rouge", "Moscou", "place", "Lieux/moscou_place_rouge_futuriste.jpg"],
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "art"), { recursive: true });
const kb = (f) => Math.round(statSync(f).size / 1024);
const webp = async (src, dest, width, q) => sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: q }).toFile(dest);

const shots = [];
for (const [name, src, cap] of SHOTS) {
  const m = await sharp(src).metadata();
  await webp(src, join(OUT, `${name}.webp`), 1600, 80);
  await webp(src, join(OUT, `${name}-800.webp`), 800, 78);
  shots.push({ name, w: 1600, h: Math.round((m.height * 1600) / m.width), cap });
  console.log(`shot ${name}: ${kb(join(OUT, `${name}.webp`))} KB`);
}

const arts = [];
for (const [slug, label, kind, rel] of ARTS) {
  const src = `${ART}/${rel}`;
  const m = await sharp(src).metadata();
  const w = Math.min(1600, m.width);
  await webp(src, join(OUT, "art", `${slug}.webp`), w, 80);
  await webp(src, join(OUT, "art", `${slug}-800.webp`), 800, 76);
  arts.push({ slug, label, kind, w, h: Math.round((m.height * w) / m.width) });
  console.log(`art ${slug}: ${kb(join(OUT, "art", `${slug}.webp`))} KB`);
}

// Key art (clean, no text) + transparent wordmark logo, both from the store pack
const key = `${PUB}/sources/key-art-paysage.png`;
await webp(key, join(OUT, "keyart.webp"), 1672, 84);
await webp(key, join(OUT, "keyart-960.webp"), 960, 80);
copyFileSync(`${PUB}/steam/library-logo_1280.png`, join(OUT, "logo.png"));

// Card cover + social share image from the Steam main capsule
const cap = `${PUB}/steam/main-capsule_1232x706.jpg`;
await sharp(cap).jpeg({ quality: 86 }).toFile(join(ROOT, "assets/projects/heroes-dawn/poster.jpg"));
await sharp(cap).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 84 }).toFile(join(ROOT, "assets/og.jpg"));

// Hell Rising teaser: two mood-only concept images (no characters, no story). The project has just started.
const HR = process.env.HR_ROOT || "E:/Projets/HellRising";
const HR_OUT = join(ROOT, "assets/hell-rising");
rmSync(HR_OUT, { recursive: true, force: true });
mkdirSync(HR_OUT, { recursive: true });
for (const [name, rel] of [["cendres", "01_Pilote_v01/02_cendres_du_seuil_v01.png"], ["vue-jeu", "01_Pilote_v01/05_vue_jeu_indicative_v01.png"]]) {
  const src = `${HR}/04_Direction_artistique/${rel}`;
  await webp(src, join(HR_OUT, `${name}.webp`), 1600, 80);
  await webp(src, join(HR_OUT, `${name}-800.webp`), 800, 76);
  console.log(`hell-rising ${name}: ${kb(join(HR_OUT, `${name}.webp`))} KB`);
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify({ shots, arts }, null, 2) + "\n");
console.log(`Wrote ${shots.length} captures + ${arts.length} illustrations.`);
