# STUDIO N29 — Portfolio

Portfolio de Djason Nathiez (Unity Gameplay Programmer, freelance). Site statique FR/EN publié via GitHub Pages sur `n29-studio.fr`.

## Modifier le contenu

- Textes : `i18n/fr.json` et `i18n/en.json` (mêmes clés dans les deux fichiers).
- Projets, technos, images : tableau `PROJECTS` dans `tools/build.mjs`. Les images vont dans `assets/projects/`.
- Couleur d'accent : variable `--accent` dans `css/base.css`.

Après toute modification de texte ou de projet, régénérer les pages :

```bash
node tools/build.mjs
```

Le script produit du HTML statique (français pré-rendu pour le SEO) ; l'anglais est chargé côté navigateur par `js/i18n.js`.

## Prévisualiser en local

```bash
npx http-server -p 4173 -c-1 .
```

Puis ouvrir http://localhost:4173.
