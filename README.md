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
    ├── js/main.js        Menu mobile + sélection du montant de don
    ├── js/render.js      Affiche agenda, galerie, photos et bureau
    ├── data/agenda.json  Événements — modifiable depuis l'admin
    ├── data/galerie.json Photos de la galerie — modifiable depuis l'admin
    ├── data/site.json    Photos des pages et bureau — modifiable depuis l'admin
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
| **Agenda** | Les rendez-vous : titre, date, heure, lieu, précision |
| **Galerie photos** | Les photos de la page Galerie et leur taille dans la mosaïque |
| **Photos du site & bureau** | Les 5 photos d'illustration des pages, et les membres du bureau |

L'admin repose sur **Decap CMS** — le même outil que le site Kanjo Aïkido —
avec le dépôt GitHub comme backend : tout ce qui est enregistré (textes **et**
photos) devient un fichier du dépôt. Rien n'est stocké sur un service tiers.

### Deux automatismes utiles

- **Les événements passés disparaissent tout seuls** du site. Inutile de faire
  le ménage : il suffit d'ajouter les nouveaux.
- **Les deux prochains rendez-vous remontent automatiquement sur l'accueil.**
  Il n'y a qu'un seul endroit à tenir à jour.

### Publier

Le bouton **Publish** de l'admin enregistre dans le dépôt sur la branche
`main`, ce qui déclenche le déploiement Netlify. Le site est à jour une à deux
minutes après. Il n'y a rien d'autre à faire.

> Un montage à deux temps a existé un moment — l'admin écrivait sur une
> branche `brouillon` et une action GitHub publiait le lot d'un coup, pour
> n'avoir qu'un seul déploiement. Il a été retiré : le libellé « Publish » de
> Decap laissait croire que le site partait en ligne, et le site n'ayant
> aucune étape de build, multiplier les déploiements ne coûte rien.
> Le nécessaire reste dans l'historique Git si le besoin revenait.

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

### Bon à savoir

L'agenda et la galerie sont assemblés dans le navigateur à partir des fichiers
`assets/data/*.json`. C'est ce qui permet de garder un site sans build tout en
ayant une admin. Conséquence : ces contenus ne sont pas dans le HTML livré, et
un moteur de recherche les indexe moins bien qu'un texte statique. Sans
importance pour des événements par nature éphémères ; si l'agenda devait un
jour être un vrai levier de référencement, il faudrait ajouter un générateur
statique (Eleventy) qui pré-calcule les pages.

## Ajouter un événement sans passer par l'admin

Ouvrir `assets/data/agenda.json` et ajouter un objet à la liste :

```json
{
  "titre": "Atelier cuisine de saison",
  "date": "2026-11-14",
  "horaire": "15h",
  "lieu": "Cantine scolaire",
  "precision": "gratuit"
}
```

La date s'écrit `AAAA-MM-JJ`. L'ordre dans le fichier n'a pas d'importance :
le tri, le regroupement par mois et la couleur du chiffre sont calculés à
l'affichage.
