# STUDIO N29 — Site web

Site statique du studio (EN par défaut / FR) publié via GitHub Pages sur `n29-studio.fr`.

## Pages

| Page | Fichier | Source |
|---|---|---|
| Accueil | `index.html` | `tools/lib/pages/home.mjs` |
| Heroes Dawn (jeu en vedette) | `heroes-dawn.html` | `tools/lib/pages/heroes-dawn.mjs` |
| Studio | `studio.html` | `tools/lib/pages/studio.mjs` |
| Portfolio (à part, pro de Djason) | `portfolio.html` | `tools/lib/pages/portfolio.mjs` |
| Contact | `contact.html` | `tools/lib/pages/contact.mjs` |
| Fiches projets (rattachées au portfolio) | `projects/<slug>.html` | `tools/lib/pages/project.mjs` |

Sections partagées accueil / Heroes Dawn (onglets de fonctionnalités, visionneuse de personnages, bannière wishlist) : `tools/lib/sections.mjs`.
Polices auto-hébergées (Barlow, Barlow Condensed, licence OFL) dans `assets/fonts/`. Palette « Aube Tactique » du jeu : marine `#101C29`, ivoire `#ECE7DC`, laiton `#D6AF5B`.

## Visuels Heroes Dawn (build 1.0.2)

`npm run images` importe depuis `E:\Projets\HeroesDawn` (variable `HD_ROOT` pour un autre chemin) :
- key art et logo « Aube Tactique » : `publication-aube-tactique/sources/key-art-paysage.png` et `steam/library-logo_1280.png` ;
- captures réelles du jeu : `publication-aube-tactique/steam/screenshots`, `captures-release`, `captures-pc`, `captures-brutes` (liste `SHOTS` dans `tools/images.mjs`) ;
- illustrations des agents de The Dawn (cryptides inclus, ce sont des agents aussi) et de lieux : `principal/03_Art_UI_UX/Illustrations`. La liste des agents est dans `tools/lib/agents.mjs` ; leur zone, pouvoir et description (FR/EN) sont dans `i18n/{fr,en}.agents.json` (clés `ag.<slug>.t` et `ag.<slug>.d`, d'après `02_Lore_Narration/04_Agents_The_Dawn.md`).

Les fichiers générés sont dans `assets/heroes-dawn/` (committés) ; `assets/og.jpg` et `assets/projects/heroes-dawn/poster.jpg` viennent de la capsule Steam principale.

Les fichiers HTML, `sitemap.xml`, `robots.txt` et `js/i18n-data.js` sont **générés** : ne pas les éditer à la main.

## Modifier le contenu

- Textes : `i18n/{en,fr}.json` (portfolio d'origine) et `i18n/{en,fr}.studio.json` (site studio, prioritaire). Mêmes clés dans les deux langues.
- Projets (liste, technos, images) : `tools/lib/data.mjs`.
- **Lien Steam** : renseigner `STEAM_URL` dans `tools/lib/data.mjs`. Vide, les boutons affichent « Bientôt sur Steam » (non cliquable).
- Couleurs : variables `--accent` / `--gold` dans `css/base.css` et `css/studio.css`.

## Commandes

```bash
npm install          # une fois (sharp, pour les images)
npm run build        # régénère toutes les pages
npm run check        # liens, clés i18n FR/EN, dossiers protégés
npm run images       # réimporte les captures Heroes Dawn (nécessite le dépôt du jeu en local)
npx http-server -p 4173 -c-1 .   # prévisualisation sur http://localhost:4173
```

Après toute modification : `npm run build && npm run check`, puis commit des fichiers générés (GitHub Pages sert le dépôt tel quel).

## Dossiers à ne pas toucher

`hd-legal-…`, `hd-test-…`, `hq-r7k29m`, `d-pwqxes9jai6i` (URLs non listées) et `CNAME`. `npm run check` vérifie qu'ils sont inchangés.
