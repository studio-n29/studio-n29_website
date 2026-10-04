# Refonte STUDIO N29 en portfolio de développeur — Spec de design

Date : 2026-10-05

## Objectif

Remplacer le site d'agence actuel (web, IT, IA, tarifs, FAQ) par un portfolio de développeur Unity (Gameplay Programming) destiné à trouver des missions freelance. Publié sur GitHub Pages (domaine `n29-studio.fr`, `CNAME` conservé).

Qualités attendues : très pro, propre, animé, responsive, clair, personnel (identité STUDIO N29).

## Contexte

- Développeur : Djason Nathiez, Unity, gameplay / system / network, Rubika (Supinfogame, Bachelor Programmation 2019-2023). Compétences full-stack web, LLM/IA, Neo4j en complément (voir CV).
- Expériences (CV `CV Dev.pdf`) : IdentityOS (fullstack, API IA + jeu narratif Unity, 2026-2027), Central Cars (web dev, 2024-2025), Simoldes Plasticos (technicien IT, 2024).
- Projets à présenter :
  - **Discosmos** : implémentation de l'ensemble du système réseau + système de sorts des personnages. Source : `Downloads/Discosmos-main.zip`.
  - **Beat Strike** : création de l'outil de rythme (CapacityTool / patterns) + boucle de gameplay principale. Source : `Downloads/BeatStrike-develop.zip`.
  - **Heroes Dawn** : RPG 3D tour par tour avec timeline active, life sim / MMORPG. Sources : `Documents/Heroes Dawn`, `Documents/Git/heroesdawn-*`.
  - **Delight** : migration en cours vers Unity 6. Source : `D:/ForkGit/Delight`.
  - **Project X** : **sous NDA**. Présenté de façon volontairement vague, aucun contenu du dossier `projectX` n'est utilisé.
- Logo : `STUDIO N29.png` (blanc sur noir), à vectoriser en SVG transparent.

## Décisions

- Langues : français + anglais, switch FR/EN, langue mémorisée et détectée au premier passage.
- Direction visuelle : monochrome tranchant — noir profond, blanc cassé, un seul accent violet électrique (~`#8A5CFF`, variable CSS unique). Les diagonales du logo sont le langage graphique.
- Technique : HTML / CSS / JS pur, sans build. Textes dans `i18n/fr.json` et `i18n/en.json`. Animations CSS + IntersectionObserver, aucune librairie lourde. Polices auto-hébergées.

## Structure du dépôt

```
index.html
projects/{discosmos,beat-strike,heroes-dawn,delight,project-x}.html
css/   base, composants, animations
js/    i18n, animations/reveal, navigation, formulaire
i18n/  fr.json, en.json
assets/ logo (svg), images, polices, projects/
CNAME, favicon, sitemap.xml, robots.txt
```

Supprimés : pages agence (`conseil-formation-ia`, `developpement-web-logiciel`, `maintenance-informatique-reseau`, `game-studio`, `spark-of-remains`), ancien `style.css` / `script.js`. `.old/` n'est pas touché.

## Contenu

- **Hero** : nom, « Unity Gameplay Programmer », mention de disponibilité freelance, logo N en grand, CTA projets + contact.
- **Projets** : grille de cartes avec rôle explicite ; chaque page détail = contexte, ma contribution, extraits de code/schémas, technos, médias.
- **Project X** : carte « sous NDA » (cadenas), description générique.
- **Compétences** : par catégories (gameplay, systèmes, réseau, outils d'éditeur, full-stack, IA), sans barres de pourcentage.
- **Parcours** : Rubika, IdentityOS, Central Cars, Simoldes.
- **Contact** : formulaire fonctionnel conservé (mécanisme existant à réutiliser), email, mention freelance.

## Style et animation

Fond noir, blanc cassé, accent violet ; grotesque nette + mono pour les détails techniques. Séparateurs de sections en biais, hovers qui « tranchent », révélations au scroll, curseur discret, transitions courtes. `prefers-reduced-motion` respecté. Mobile-first, menu burger, images optimisées.

## SEO et qualité

Meta FR/EN, Open Graph, `hreflang`, sitemap, robots, JSON-LD `Person`. Aucune dépendance externe hors polices auto-hébergées.

## Médias

Extraction de captures/logos/vidéos exploitables depuis les zips et dossiers. À défaut, emplacement visuel propre prêt à recevoir les captures dans `assets/projects/`.

## Vérification

Serveur local, test desktop + mobile, FR + EN, formulaire, console sans erreur, liens. Aucune publication (push) sans demande explicite.

## Hors périmètre

Nettoyage de `.old/`, section tarifs/services, blog, CMS.
