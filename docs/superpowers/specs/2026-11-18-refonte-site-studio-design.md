# Refonte du site STUDIO N29 — design

Date : 2026-11-18 · Statut : en attente d'approbation

## Intention et pourquoi
Le site actuel est le portfolio freelance de Djason Nathiez. Il doit devenir le site d'un **studio de jeu vidéo** au rendu professionnel (références : Blizzard Entertainment, Ankama). Deux publics, deux actions :
- **Joueurs** → wishlister **Heroes Dawn** ;
- **Éditeurs / clients** → contacter le studio (missions freelance, collaborations).

Heroes Dawn est le jeu en vedette : présenté sur l'accueil et sur une page dédiée détaillée, avec les visuels de la **dernière version** du jeu.

## Objectifs
- Structure multi-pages claire : Accueil, Jeux (portfolio), Heroes Dawn, Studio, Contact.
- Rendu éditorial « AAA » : hero plein écran, grands visuels, typographie display, animations sobres, lightbox.
- Heroes Dawn mis en avant partout (accueil, nav, CTA wishlist).
- FR / EN conservés, SEO conservé (HTML pré-rendu, sitemap, JSON-LD Organization / VideoGame).
- Responsive complet, accessible (contrastes, focus, `prefers-reduced-motion`), léger (images WebP optimisées).

## Non-objectifs / anti-objectifs
- Pas de framework front, pas de SPA, pas de backend : le site reste statique, publié sur GitHub Pages sans changer ses réglages.
- Ne pas casser ni exposer les dossiers à URL cachée : `hd-legal-4f7a2c91e6b3/`, `hd-test-2088620bed5f92562b0e18cc/`, `hq-r7k29m/`, `d-pwqxes9jai6i/`, ni `CNAME`.
- Pas d'invention de contenu : pas de faux chiffres, faux joueurs ou fausse date de sortie. Pas de polices ni d'analytics tiers (RGPD).
- Anti-objectif : un site qui ressemble encore à un CV freelance.

## Contraintes
- GitHub Pages (statique), domaine `n29-studio.fr`.
- Générateur existant : `tools/build.mjs` (Node), textes dans `i18n/{fr,en}.json`.
- Aucun lien Steam n'existe encore : le bouton wishlist est un emplacement configurable (« Bientôt sur Steam ») à remplacer par l'URL.

## Approches considérées
- **A. Faire évoluer le générateur Node** — retenue (choisie par l'utilisateur). Zéro changement de déploiement, pas de dépendance au runtime.
- B. Migrer vers Astro / 11ty — écartée : migration de déploiement (GitHub Actions) pour aucun gain visuel.
- C. SPA React/Vite — écartée : SEO et poids.

## Conception (décidée avec l'utilisateur)
Pages et URL :
| Page | URL | Contenu |
|---|---|---|
| Accueil | `/` | Hero Heroes Dawn plein écran + CTA wishlist ; bande « le studio » ; jeux ; bloc « travailler avec nous » |
| Jeux | `/jeux.html` | Grille portfolio filtrable (type, statut), Project X en NDA |
| Heroes Dawn | `/heroes-dawn.html` | Pitch, piliers (timeline de combat, exploration sur plateau, QG), personnages, galerie récente, feuille de route, wishlist |
| Studio | `/studio.html` | Studio, univers Apex, savoir-faire, avis Malt, parcours |
| Contact | `/contact.html` | Formulaire (Web3Forms existant), offres pour éditeurs/clients, liens |
| Fiches projet | `/projects/<slug>.html` | URLs existantes conservées ; `projects/heroes-dawn.html` redirige vers `/heroes-dawn.html` |

## Décisions du constructeur (mes choix, à corriger si besoin)
- Direction visuelle : fond sombre, accent rouge/or tiré de l'art de Heroes Dawn ; l'identité N29 (logo, slash) est conservée.
- Typographie : Space Grotesk + JetBrains Mono existantes, plus une police display condensée **auto-hébergée** (woff2 local) pour les titres.
- Visuels Heroes Dawn : captures récentes de `E:\Projets\HeroesDawn\build\captures-apres` et art existant (`poster.jpg`, `agent-*.webp`), sélectionnés puis convertis en WebP via un script d'optimisation ajouté à `tools/`.
- Navigation commune : Jeux · Heroes Dawn · Studio · Contact + bouton « Wishlist ».
- Mise à jour de `sitemap.xml`, `robots.txt`, du README et de `.claude/launch.json` si nécessaire.

## Laissé au constructeur
Choix exact des captures, rédaction FR/EN des nouveaux textes à partir de contenus existants, détail des animations, choix de la police display, tests visuels desktop/mobile.
