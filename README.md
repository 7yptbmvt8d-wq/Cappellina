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
└── assets/
    ├── css/style.css     Feuille de style unique (tous les tokens du design)
    ├── css/fonts.css     Déclarations @font-face des polices auto-hébergées
    ├── fonts/            Quicksand + Nunito au format woff2
    ├── js/main.js        Menu mobile + sélection du montant de don
    ├── logo-cappellina.png   ← à déposer
    └── banniere.jpg          ← à déposer
```

L'en-tête et le pied de page sont **répétés dans chaque page** : c'est le prix
du « zéro build ». Toute modification d'un lien de navigation doit donc être
reportée dans les 9 fichiers HTML.

---

## À compléter avant la mise en ligne

Tous les points ci-dessous sont signalés par un commentaire `TODO` dans le code.

### 1. Les deux images

Déposer `logo-cappellina.png` (fond transparent) et `banniere.jpg` dans
`assets/`. Voir `assets/README.md` pour les formats attendus.

### 2. Les liens HelloAsso

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

### 3. Les coordonnées et le bureau

- Téléphone `06 00 00 00 00` — placeholder présent dans le pied de page des 9 pages.
- Adresse `contact@cappellina.fr` — à confirmer.
- Liens Facebook / Instagram — actuellement du texte simple, à transformer en liens.
- `association.html` : les trois « Prénom Nom » du bureau et leurs photos.

### 4. Les photos

Les zones rayées sont des placeholders (`class="ph"`). Voir `assets/README.md`.

---

## Mise en ligne sur Netlify

1. Sur [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connecter le dépôt GitHub, choisir la branche à publier
3. Laisser les réglages tels quels : `netlify.toml` fixe déjà
   *publish directory = racine* et **aucune commande de build**
4. Déployer

Chaque `git push` sur la branche publiée redéclenche un déploiement.

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

## Ajouter un événement à l'agenda

Ouvrir `agenda.html`, dupliquer un bloc `<article class="event">` et adapter le
jour, le mois, le titre et la ligne d'informations. La couleur du chiffre
alterne entre `c-peach`, `c-sage` et `c-blue`. Un commentaire dans le fichier
détaille la marche à suivre.

Penser à reporter les deux prochains événements sur l'accueil (`index.html`,
section « Prochains rendez-vous »).
