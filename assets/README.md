# Images à déposer dans ce dossier

Deux fichiers sont attendus ici. Tant qu'ils sont absents, le logo apparaît
sous forme de texte alternatif et la bannière de l'accueil reste vide.

| Fichier | Description | Format conseillé |
|---|---|---|
| `logo-cappellina.png` | Logo officiel (mésange tirant un ruban de personnes + mot-marque « Cappellina »), **fond transparent** | PNG, hauteur ≥ 160 px |
| `banniere.jpg` | Illustration aquarelle des activités (couture, phare, jeux, randonnée, mer) | JPG, largeur ≥ 2048 px |

Les noms de fichiers doivent être respectés à l'identique : ils sont référencés
tels quels dans les pages HTML.

## Photos de l'association

Les zones rayées (`class="ph"`) présentes sur les pages Accueil, Association,
Nos actions et Galerie sont des **placeholders**. Pour les remplacer, déposer
les photos dans un sous-dossier `assets/photos/` et substituer le `<div>` par
une balise `<img>` — voir les commentaires dans `galerie.html`.

Penser à compresser les photos avant mise en ligne (viser < 300 Ko par image)
et à renseigner un texte alternatif décrivant la scène.
