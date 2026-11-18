# Refonte du site STUDIO N29 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le portfolio freelance en site de studio multi-pages (Accueil, Jeux, Heroes Dawn, Studio, Contact) avec Heroes Dawn en vedette.

**Architecture:** `tools/build.mjs` reste l'unique générateur de HTML statique ; il est découpé en modules (`tools/lib/*.mjs`) : données, gabarits partagés, une fonction par page. CSS refait en 4 fichiers. Un script `tools/images.mjs` convertit les captures Heroes Dawn en WebP.

**Tech Stack:** Node (ESM), HTML/CSS/JS vanilla, `sharp` en devDependency (build uniquement), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-18-refonte-site-studio-design.md`

## Global Constraints
- Site 100 % statique, publié par GitHub Pages ; aucun runtime serveur, aucun framework front.
- Ne jamais modifier : `hd-legal-4f7a2c91e6b3/`, `hd-test-2088620bed5f92562b0e18cc/`, `hq-r7k29m/`, `d-pwqxes9jai6i/`, `CNAME`, `.old/`.
- Polices auto-hébergées uniquement ; aucun script ni CDN tiers (hors Web3Forms existant pour le formulaire).
- FR/EN : toute clé existe dans `i18n/fr.json` et `i18n/en.json` ; anglais pré-rendu (défaut), français via `js/i18n.js`.
- Pas de contenu inventé : aucune date de sortie, aucun chiffre de joueurs ; bouton wishlist = `STEAM_URL` (constante dans `tools/lib/data.mjs`, vide → « Bientôt sur Steam », désactivé).
- URLs conservées : `projects/<slug>.html` ; `projects/heroes-dawn.html` redirige vers `/heroes-dawn.html`.
- Accessibilité : focus visible, contrastes AA, `prefers-reduced-motion` respecté, `alt` sur les images.

## Review Focus
- JS désactivé : les pages doivent rester lisibles (contenu pré-rendu, pas de `reveal` qui cache le texte).
- Ordinateur et mobile 375 px : pas de scroll horizontal, menu burger utilisable au clavier.
- `STEAM_URL` vide : aucun lien mort ni bouton trompeur.
- Chemins relatifs corrects depuis `/` et depuis `/projects/`.
- Bascule FR↔EN : aucune clé manquante affichée brute.

## File Structure
- `tools/build.mjs` — orchestre l'écriture des pages, sitemap, robots.
- `tools/lib/data.mjs` — `PROJECTS`, `STEAM_URL`, constantes site.
- `tools/lib/layout.mjs` — `head()`, `header()`, `footer()`, `scripts()`.
- `tools/lib/pages/{home,games,heroes-dawn,studio,contact,project}.mjs` — une fonction `render(ctx): string` par page.
- `tools/images.mjs` — conversion WebP des captures sources.
- `tools/check.mjs` — vérifications automatiques (liens, clés i18n, chemins, fichiers protégés).
- `css/{base,layout,components,pages}.css`, `js/ui.js` (+ carrousel/filtre).

---

### Task 1: Fondations — modules de build et garde-fous
**Files:** Create `tools/lib/data.mjs`, `tools/lib/layout.mjs`, `tools/check.mjs`; Modify `tools/build.mjs`, `package.json` (create, `"type":"module"`, script `build`, `check`).
**Interfaces:**
- Produces: `PROJECTS`, `STEAM_URL: string`, `SITE`; `head(opts): string`, `header(prefix: string, current: string): string`, `footer(prefix): string`; `check.mjs` exit 1 on failure.
- [ ] **Step 1:** Écrire `tools/check.mjs` : échoue si (a) un `href`/`src` relatif d'un `.html` généré pointe vers un fichier absent, (b) une clé `data-i18n*` est absente de `fr.json` ou `en.json`, (c) `git diff`/hash montre une modification des dossiers protégés (comparer à une liste de hash écrite au 1er run dans `tools/.protected.json`).
- [ ] **Step 2:** Lancer `node tools/check.mjs` sur le site actuel : doit passer (base de référence).
- [ ] **Step 3:** Extraire `PROJECTS`/constantes et `head/header/footer/scripts` de `build.mjs` vers les modules ; header : liens Jeux · Heroes Dawn · Studio · Contact + bouton Wishlist (état selon `STEAM_URL`).
- [ ] **Step 4:** `node tools/build.mjs && node tools/check.mjs` → pages actuelles régénérées sans erreur.
- [ ] **Step 5:** Commit `refactor: split site generator into modules`.

### Task 2: Pipeline d'images Heroes Dawn
**Files:** Create `tools/images.mjs`, `assets/heroes-dawn/*.webp`; Modify `package.json`.
**Interfaces:** Produces `assets/heroes-dawn/<nom>.webp` (largeurs 1920 et 960 : `<nom>.webp`, `<nom>-960.webp`) + `assets/heroes-dawn/manifest.json` : `{ file, w, h, caption_key }[]`.
- [ ] **Step 1:** Lister les captures de `E:\Projets\HeroesDawn\build\captures-apres` (et snapshot `_snapshots/lowpoly-v1-2026-11-17`) ; en retenir 10–14 : combat (04, 04b, 04c), plateau (03, 03b, 03c), QG (02, 10), résultats (05), mini-jeux (100–103), dialogue (08/121), quêtes (123). Écarter écrans de debug/connexion/erreur.
- [ ] **Step 2:** Implémenter `tools/images.mjs` : lit une liste `SOURCES` (chemin source → nom cible), produit les deux tailles en WebP q80 avec `sharp`, écrit le manifest. Vérifier : `node tools/images.mjs` → fichiers présents, chacun < 400 Ko.
- [ ] **Step 3:** Commit `feat: import latest Heroes Dawn captures`.

### Task 3: Design system CSS
**Files:** Create `css/layout.css`, `css/pages.css`, `assets/fonts/<display>.woff2`; Modify `css/base.css`, `css/components.css`, `css/animations.css`.
**Interfaces:** Produces classes utilisées par les pages : `.hero-full`, `.section`, `.section-head`, `.grid-games`, `.card-game`, `.feature`, `.gallery`, `.btn--primary|ghost`, `.badge`, `.reveal` (visible par défaut sans JS via `.js .reveal`), variables `--accent` (rouge), `--gold`, `--bg`, `--ink`.
- [ ] **Step 1:** Choisir et télécharger une police display condensée sous licence libre (OFL), l'auto-héberger en woff2 ; sinon rester sur Space Grotesk (noter le choix dans le README).
- [ ] **Step 2:** Écrire les 4 CSS : thème sombre rouge/or, hero plein écran avec voile dégradé, header transparent→opaque au scroll, grille 12 col, cartes jeu au survol, galerie masonry, footer riche, breakpoints 1100/760/480.
- [ ] **Step 3:** Vérifier visuellement sur une page de test générée (Task 4) ; ajouter `@media (prefers-reduced-motion)` qui coupe animations et marquee.
- [ ] **Step 4:** Commit `feat: new studio design system`.

### Task 4: Accueil
**Files:** Create `tools/lib/pages/home.mjs`; Modify `tools/build.mjs`, `i18n/{fr,en}.json`.
**Interfaces:** Consumes `layout.mjs`, `PROJECTS`. Produces `home.render(): string` → `index.html`.
- [ ] **Step 1:** Sections : hero plein écran (poster Heroes Dawn, logo, accroche, CTA « Wishlist » + « Découvrir le jeu ») → bande studio (3 chiffres vrais : 6 projets, Unity, depuis 2019 ; sinon tagline) → carrousel/mosaïque captures → grille des jeux (3 à 4) → bloc « Travailler avec nous » (CTA Contact) → footer. JSON-LD `Organization` + `VideoGame`.
- [ ] **Step 2:** Ajouter les clés i18n FR et EN. `node tools/build.mjs && node tools/check.mjs` → OK.
- [ ] **Step 3:** Vérifier dans la preview (`site`, port 4173) : desktop et 375 px, console sans erreur.
- [ ] **Step 4:** Commit `feat: new home page`.

### Task 5: Page Heroes Dawn
**Files:** Create `tools/lib/pages/heroes-dawn.mjs`; Modify `tools/build.mjs`, `i18n/*`; `projects/heroes-dawn.html` → redirection (meta refresh + canonical).
**Interfaces:** Consumes `assets/heroes-dawn/manifest.json`. Produces `heroes-dawn.html`.
- [ ] **Step 1:** Sections : hero (poster + wishlist) ; « Le jeu » (pitch tiré de `p.heroes-dawn.ctx`) ; piliers : combat sur timeline active, exploration sur plateau, gestion du QG ; personnages (agent-01…09) ; galerie lightbox des nouvelles captures ; feuille de route (Steam Early Access puis mobile, sans date) ; fiche technique (Unity 6, clean architecture) ; wishlist finale.
- [ ] **Step 2:** `node tools/build.mjs && node tools/check.mjs` → OK ; test : `STEAM_URL` vide → bouton désactivé « Bientôt sur Steam » sans `href` mort.
- [ ] **Step 3:** Vérifier lightbox au clavier (Échap, flèches) dans la preview.
- [ ] **Step 4:** Commit `feat: Heroes Dawn dedicated page`.

### Task 6: Jeux (portfolio), Studio, Contact, fiches projet
**Files:** Create `tools/lib/pages/{games,studio,contact,project}.mjs`; Modify `js/ui.js` (filtre), `i18n/*`, `tools/build.mjs`.
**Interfaces:** Produces `jeux.html` (généré par `games.mjs`), `studio.html`, `contact.html`, `projects/<slug>.html`.
- [ ] **Step 1:** `jeux.html` : filtres type/statut en JS progressif (sans JS, tout est affiché) ; Heroes Dawn en carte large puis les autres ; Project X marqué NDA.
- [ ] **Step 2:** `studio.html` : le studio, univers Apex, savoir-faire (contenu des anciennes sections skills/about), avis Malt, parcours.
- [ ] **Step 3:** `contact.html` : formulaire existant (`js/form.js`, clé Web3Forms inchangée), offres éditeurs/clients, liens LinkedIn/Malt/mail.
- [ ] **Step 4:** Fiches projet réécrites avec le nouveau layout ; le contenu `p.<slug>.*` est conservé.
- [ ] **Step 5:** `node tools/build.mjs && node tools/check.mjs` ; commit `feat: games, studio, contact pages`.

### Task 7: Finitions et vérification finale
**Files:** Modify `README.md`, `sitemap.xml` (généré), `robots.txt`, `assets/og.jpg` (si visuel Heroes Dawn dispo).
- [ ] **Step 1:** README : nouvelle structure, `npm run build`, où mettre `STEAM_URL`.
- [ ] **Step 2:** Parcours complet dans la preview : 5 pages × desktop/375 px × FR/EN, console propre, aucun lien mort (`check.mjs`), JS désactivé lisible.
- [ ] **Step 3:** Confirmer que les dossiers protégés sont inchangés (`check.mjs`) ; commit `chore: docs and final polish`.

## Self-review
- Couverture du spec : pages (T4–T6), visuels récents (T2, T5), CTA wishlist (T1, T4, T5), FR/EN + SEO (T4–T6, T7), dossiers protégés (T1, T7), pas de contenu inventé (Global Constraints).
- Commits : `git` refuse le dossier (ownership) ; il faut `safe.directory` avant les étapes de commit, sinon elles sont sautées et signalées.
