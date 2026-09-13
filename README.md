# Cappellina — site vitrine

Site de l'association **Cappellina** (loi 1901) — *« Le lien qui nous rassemble »*.
Ateliers, rencontres et sorties qui réunissent jeunes, familles et aînés.

Site **statique HTML/CSS**, sans build ni dépendance : on ouvre les fichiers,
on modifie, on publie. Hébergement prévu sur **Netlify**.

---

## Aperçu local

Aucune installation n'est nécessaire — il suffit d'ouvrir `index.html` dans un
navigateur. Pour que le formulaire de contact et la page 404 se comportent
comme en production, mieux vaut passer par un petit serveur local :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

---

## Structure

```
.
├── index.html            Accueil
├── association.html      L'association (histoire, valeurs, bureau)
├── actions.html          Nos actions (ateliers, rencontres, sorties)
├── agenda.html           Agenda des rendez-vous
├── galerie.html          Galerie photos
├── don.html              Faire un don
├── adherer.html          Nous rejoindre (adhésion + contact)
├── merci.html            Confirmation d'envoi du formulaire
├── 404.html              Page introuvable
├── netlify.toml          Configuration Netlify
├── robots.txt
├── admin/
│   ├── index.html        Espace admin (Decap CMS)
│   └── config.yml        Rubriques et champs de l'admin
└── assets/
    ├── css/style.css     Feuille de style unique (tous les tokens du design)
    ├── css/fonts.css     Déclarations @font-face des polices auto-hébergées
    ├── fonts/            Quicksand + Nunito au format woff2
    ├── js/main.js        Menu mobile
    ├── js/render.js      Applique les textes et affiche activités, agenda,
    │                     galerie, photos et bureau
    ├── data/textes.json    Textes des 9 pages — modifiable depuis l'admin
    ├── data/activites.json Familles et fiches d'activité — modifiable depuis l'admin
    ├── data/reglages.json  Coordonnées et liens externes — modifiable depuis l'admin
    ├── data/agenda.json    Événements — modifiable depuis l'admin
    ├── data/galerie.json   Photos de la galerie — modifiable depuis l'admin
    ├── data/site.json      Photos des pages et bureau — modifiable depuis l'admin
    ├── photos/           Photos envoyées depuis l'admin
    ├── logo-cappellina.png   Logo officiel, fond transparent
    └── banniere.jpg          Illustration de l'accueil
```

L'en-tête et le pied de page sont **répétés dans chaque page** : c'est le prix
du « zéro build ». Toute modification d'un lien de navigation doit donc être
reportée dans les 9 fichiers HTML.

---

## À compléter avant la mise en ligne

Tous les points ci-dessous sont signalés par un commentaire `TODO` dans le code.

### 1. Les liens HelloAsso

Deux URL sont à remplacer. Elles contiennent volontairement le mot
`VOTRE-ASSOCIATION` pour être impossibles à rater :

| Fichier | Bouton | À remplacer par |
|---|---|---|
| `adherer.html` | « Adhérer en ligne » | l'URL du formulaire d'**adhésion** HelloAsso |
| `don.html` | « Faire mon don » | l'URL du formulaire de **don** HelloAsso |

Pour les retrouver :

```bash
grep -rn "VOTRE-ASSOCIATION" .
```

HelloAsso gère le paiement sécurisé et l'édition automatique du reçu fiscal :
rien à installer côté site.

### 2. Les liens Facebook / Instagram

Actuellement du texte simple dans le pied de page des 9 pages, à transformer
en liens une fois les pages créées.

L'adresse `cappellina2b@gmail.com` et le téléphone `06.33.25.34.97` sont en
place, tous deux cliquables.

### 3. Les photos des pages

Les zones rayées attendent les vraies photos. Tout se fait depuis l'espace
admin (voir plus bas) — aucune retouche de code. Le bureau est renseigné.

---

## Mise en ligne sur Netlify

1. Sur [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connecter le dépôt GitHub, choisir la branche **`main`** comme branche de production
3. Laisser les réglages tels quels : `netlify.toml` fixe déjà
   *publish directory = racine* et **aucune commande de build**
4. Déployer
5. **Site configuration → Access control → OAuth → Install provider → GitHub**
   (nécessaire pour que l'espace admin fonctionne)

Ensuite, chaque push sur `main` redéclenche un déploiement — y compris ceux
faits depuis l'espace admin.

### Formulaire de contact

Le formulaire de `adherer.html` utilise **Netlify Forms** — actif dès le premier
déploiement, sans configuration ni service tiers :

- les messages arrivent dans **Site configuration → Forms** du tableau de bord ;
- pour être prévenu par mail : **Forms → Form notifications → Add notification** ;
- un champ anti-spam (honeypot) est déjà en place ;
- après envoi, le visiteur est redirigé vers `merci.html`.

> Le formulaire ne fonctionne **que sur Netlify**. En local, l'envoi mène à une
> page d'erreur — c'est normal.

### Nom de domaine

**Domain management → Add a domain** pour brancher `cappellina.fr`.
Le HTTPS (certificat Let's Encrypt) est automatique.

---

## Charte graphique

Reprise fidèlement des maquettes, centralisée en variables CSS au début de
`assets/css/style.css`.

**Couleurs**

| Rôle | Variable | Hex |
|---|---|---|
| Fond principal (crème) | `--cream` | `#FBF7F1` |
| Fond alterné / sections | `--cream-alt` | `#F3E9DF` |
| Texte principal | `--ink` | `#4A4440` |
| Texte secondaire | `--ink-2` | `#6b635c` |
| Texte tertiaire | `--ink-3` | `#a89f96` |
| Accent pêche (primaire) | `--peach` | `#E8B79E` |
| Accent terracotta (liens) | `--terracotta` | `#C97F55` |
| Accent sauge | `--sage` | `#8FA98A` |
| Accent bleu doux | `--blue` | `#9AAEC4` |
| Slogan / brun chaud | `--brown` | `#a8714f` |
| Bordures | `--border` | `#E4D8CB` |

**Typographie** — Quicksand (titres et interface) + Nunito (corps de texte).

Les polices sont **auto-hébergées** dans `assets/fonts/` (woff2, sous-ensembles
latin et latin-ext) plutôt que chargées depuis `fonts.googleapis.com`. Trois
raisons :

- **RGPD** — appeler le CDN Google transmet l'adresse IP des visiteurs à Google
  sans leur consentement ; plusieurs décisions européennes l'ont sanctionné.
  Pour un site associatif français, l'auto-hébergement évite complètement le sujet.
- **Fiabilité** — la page s'affiche correctement même si le CDN est bloqué
  (réseaux d'entreprise, bloqueurs).
- **Performance** — une requête tierce et une résolution DNS de moins.

Pour revenir à Google Fonts : supprimer les deux `<link>` vers `fonts.css` et
les `preload` dans les 9 pages, et remettre le `<link>` Google du prototype.

> Les fichiers de polices proviennent de Google Fonts et sont distribués sous
> licence SIL Open Font License 1.1, qui autorise l'auto-hébergement.

**Gabarit** — largeur max `1120px`, padding horizontal `48px` (`32px` en
tablette, `20px` en mobile).

**Rayons** — boutons et pilules `999px`, cartes `20–28px`, petites tuiles `12–18px`.

---

## Responsive

| Palier | Comportement |
|---|---|
| ≤ 1024 px | Padding réduit, titres et images resserrés |
| ≤ 900 px | Navigation en menu burger |
| ≤ 860 px | Grilles 2–3 colonnes → 1 colonne, galerie sur 2 colonnes |
| ≤ 640 px | Titre d'accueil à 36 px, galerie sur 1 colonne, cartes agenda empilées |

---

## Accessibilité

- Lien d'évitement « Aller au contenu » en début de page
- Page courante signalée par `aria-current="page"`
- Menu burger avec `aria-expanded` et fermeture à la touche Échap
- Champs de formulaire tous associés à un `<label>`
- Contours de focus visibles au clavier
- `prefers-reduced-motion` respecté

---

## Espace admin

Accessible sur `/admin` (par exemple `https://cappellina.fr/admin`). Il permet
au bureau de gérer, sans toucher au code :

| Rubrique | Contenu |
|---|---|
| **Textes des pages** | Tous les titres, paragraphes, chiffres et libellés de boutons des 9 pages |
| **Activités** | Les familles et leurs fiches : nom, description, pictogramme, horaires, référents, tarif |
| **Coordonnées & liens** | E-mail, téléphone, adresses HelloAsso, Facebook, Instagram |
| **Agenda** | Le planning hebdomadaire (jour, horaire, lieu) **et** les rendez-vous datés |
| **Galerie photos** | Les photos de la page Galerie et leur taille dans la mosaïque |
| **Photos du site & bureau** | Les 5 photos d'illustration des pages, et les membres du bureau |

Il n'y a plus de texte du site qui échappe à l'admin.

L'admin repose sur **Decap CMS** — le même outil que le site Kanjo Aïkido —
avec le dépôt GitHub comme backend : tout ce qui est enregistré (textes **et**
photos) devient un fichier du dépôt. Rien n'est stocké sur un service tiers.

### Automatismes utiles

- **Les événements passés disparaissent tout seuls** du site. Inutile de faire
  le ménage : il suffit d'ajouter les nouveaux.
- **Les deux prochains rendez-vous remontent automatiquement sur l'accueil.**
  Il n'y a qu'un seul endroit à tenir à jour.
- **Les séances hebdomadaires se rangent seules dans l'ordre de la semaine.**
  Une séance ajoutée un lundi passe en tête sans qu'on ait à réordonner la liste.
- **Un champ de texte vidé garde le texte actuellement en ligne.** Effacer un
  champ par mégarde ne peut pas creuser un trou dans une page.
- **Le bouton d'une activité découle de la case « payante ».** Cochée :
  « Réserver une place » vers la billetterie. Décochée : « S'inscrire » vers la
  page d'adhésion. Les deux ne peuvent pas se désaccorder.
- **Les liens d'appel sont fabriqués seuls.** Un numéro saisi `06 12 34 56 78`
  devient `tel:+33612345678` : il se compose d'un doigt sur un mobile.
- **Facebook et Instagram restent du simple texte** tant qu'aucune adresse
  n'est renseignée — mieux qu'un lien qui ne mène nulle part.

### Publier

Le bouton **Publish** de l'admin enregistre dans le dépôt sur la branche
`main`, ce qui déclenche le déploiement Netlify. Le site est à jour une à deux
minutes après. Il n'y a rien d'autre à faire.

> Un montage à deux temps a existé un moment — l'admin écrivait sur une
> branche `brouillon` et une action GitHub publiait le lot d'un coup, pour
> n'avoir qu'un seul déploiement. Il a été retiré parce que le libellé
> « Publish » de Decap laissait croire que le site partait en ligne.
> Le nécessaire reste dans l'historique Git si le besoin revenait.
>
> Attention : un déploiement n'est pas gratuit, même sans étape de build.
> L'offre gratuite de Netlify alloue 300 crédits par mois et facture
> 15 crédits par déploiement, soit une vingtaine de mises en ligne
> mensuelles. Enregistrer plusieurs modifications avant de publier reste donc
> une bonne habitude.

### Mise en service

**1. Activer l'authentification GitHub dans Netlify.** Dans le tableau de
bord du site : **Site configuration → Access control → OAuth → Install
provider → GitHub**. C'est exactement le réglage déjà en place sur le site
Kanjo Aïkido — aucun serveur ni service supplémentaire à déployer.

**2. Se connecter.** Ouvrir `/admin` et cliquer sur **Login with GitHub**.

Chaque personne du bureau devra avoir un **compte GitHub** et être
collaboratrice du dépôt : c'est la contrepartie du choix « tout sur GitHub ».

> Le mode `publish_mode: editorial_workflow` (celui du site Kanjo) n'est pas
> activé : il fait passer chaque modification par une pull request à valider,
> ce qui rallonge le circuit sans bénéfice pour une petite équipe. Pour
> l'ajouter, il suffit de la ligne correspondante dans `admin/config.yml`.

### Comment l'admin pilote les pages, sans étape de build

Deux mécanismes cohabitent, selon la nature du contenu.

**Les textes sont remplacés, pas générés.** Chaque élément modifiable porte un
attribut `data-texte` pointant vers une clé de `assets/data/textes.json` :

```html
<h1 data-texte="accueil.titre">Se retrouver, échanger, découvrir, rire, partager</h1>
```

Le texte reste écrit en clair dans le HTML. C'est lui que voient les visiteurs
sans JavaScript et les moteurs de recherche au premier passage ; le fichier ne
fait que le remplacer quand le bureau l'a modifié. Le référencement est donc
préservé, et une panne de JavaScript laisse un site complet, jamais une page
vide. Contrepartie : après une modification dans l'admin, le texte de repli du
HTML n'est plus celui en ligne — sans conséquence visible, mais c'est la raison
pour laquelle il ne faut pas s'étonner de les voir diverger.

**Les listes sont reconstruites.** Agenda, galerie, membres du bureau et fiches
d'activité peuvent gagner ou perdre des éléments : un simple remplacement de
texte n'y suffit pas. Ils sont donc rendus entièrement depuis leur fichier
JSON. Là encore le HTML conserve la dernière version connue comme secours.

Tout est construit avec les API du DOM (`textContent`), jamais avec
`innerHTML` : un texte saisi dans l'admin ne peut ni casser une page ni y
injecter de balises. Les pictogrammes, seuls fragments de SVG du lot, sont des
constantes du fichier `render.js` — l'admin ne fait qu'en choisir le nom dans
une liste — et passent par `DOMParser` plutôt que par `innerHTML`.

Si le site devait un jour faire du référencement un vrai levier, la marche à
suivre serait d'ajouter un générateur statique (Eleventy) qui pré-calcule les
pages à partir des mêmes fichiers JSON.

## Le planning, sans passer par l'admin

`assets/data/agenda.json` porte les deux blocs de la page Agenda, dans deux
listes distinctes.

**`rythme`** — ce qui revient chaque semaine :

```json
{
  "jour": "Jeudi",
  "titre": "Couture, broderie, crochet — adultes",
  "horaire": "10h-12h",
  "lieu": "Maison des associations, Santa Maria Poggio",
  "precision": "",
  "payante": false,
  "billetterie": ""
}
```

L'ordre de saisie n'a pas d'importance : les séances sont rangées dans l'ordre
de la semaine à l'affichage, et deux séances du même jour gardent leur ordre
de saisie. Un jour mal orthographié passe en fin de liste au lieu de fausser
le classement.

**`evenements`** — ce qui a une date précise :

```json
{
  "titre": "Atelier cuisine de saison",
  "date": "2026-11-14",
  "horaire": "15h",
  "lieu": "Cantine scolaire",
  "precision": "gratuit",
  "billetterie": ""
}
```

La date s'écrit `AAAA-MM-JJ`. Là non plus l'ordre du fichier n'importe pas :
le tri, le regroupement par mois et la couleur du chiffre sont calculés à
l'affichage, et les dates passées disparaissent d'elles-mêmes.

Dans les deux listes, `payante` (ou un lien `billetterie` pour les événements
datés) commande le bouton : « Réserver » vers la billetterie, sinon
« S'inscrire » vers la page d'adhésion. Une séance payante sans lien propre
retombe sur la page HelloAsso de l'association, renseignée dans
`assets/data/reglages.json`.
