/* ==========================================================================
   Cappellina — affichage des contenus modifiables depuis l'espace admin

   L'agenda et la galerie ne sont pas écrits en dur dans les pages : ils sont
   lus depuis assets/data/*.json, que l'espace admin (/admin) met à jour.
   Cela permet au bureau de modifier les contenus sans toucher au HTML.

   Trois emplacements sont alimentés :
     #agenda-liste    (agenda.html)  — tous les événements à venir, par mois
     #agenda-apercu   (index.html)   — les 2 prochains événements
     #galerie-grille  (galerie.html) — la mosaïque de photos

   Le contenu est construit avec les API du DOM (textContent), jamais avec
   innerHTML : le texte saisi dans l'admin ne peut pas casser la page ni
   injecter de balises.
   ========================================================================== */
(function () {
  'use strict';

  var MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  var MOIS_COURT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
                    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

  // Les trois couleurs d'accent se succèdent d'un événement à l'autre
  var COULEURS = ['c-peach', 'c-sage', 'c-blue'];

  /* ---------------------------------------------------------------------
     Utilitaires
     --------------------------------------------------------------------- */

  function el(tag, className, texte) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (texte != null) { node.textContent = texte; }
    return node;
  }

  function message(cible, texte) {
    cible.replaceChildren(el('p', 'vide', texte));
  }

  // "2026-09-12" → objet Date local (évite le décalage UTC de new Date(str))
  function parseDate(valeur) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valeur || ''));
    if (!m) { return null; }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  // Ne remplace la source d'une image que si elle diffère réellement.
  // Sans ce contrôle, le navigateur télécharge une seconde fois un fichier
  // déjà en cours de chargement — la bannière pèse plusieurs centaines de Ko.
  function poserSource(img, chemin) {
    var cible = new URL(chemin, document.baseURI).href;
    if (img.src !== cible) { img.src = cible; }
  }

  function chargerJSON(chemin) {
    // no-cache : après une modification dans l'admin, les visiteurs voient
    // la nouvelle version sans attendre l'expiration du cache navigateur.
    return fetch(chemin, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) { throw new Error(r.status + ' ' + chemin); }
      return r.json();
    });
  }

  /* ---------------------------------------------------------------------
     Agenda
     --------------------------------------------------------------------- */

  // Ne garde que les événements d'aujourd'hui ou à venir, du plus proche au
  // plus lointain : les événements passés disparaissent tout seuls.
  function evenementsAVenir(donnees) {
    var aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    return (donnees && donnees.evenements ? donnees.evenements : [])
      .map(function (ev) { return { ev: ev, date: parseDate(ev.date) }; })
      .filter(function (item) { return item.date && item.date >= aujourdhui; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  function carteEvenement(item, index, compact) {
    var ev = item.ev;
    var date = item.date;

    var article = el('article', 'event' + (compact ? ' event--compact' : ''));

    var bloc = el('div', 'event__date');
    var jour = el('div', 'event__day ' + COULEURS[index % COULEURS.length],
                  String(date.getDate()).padStart(2, '0'));
    bloc.append(jour, el('div', 'event__month', MOIS_COURT[date.getMonth()]));

    // « 14h · Salle des fêtes · gratuit » — les champs vides sont ignorés
    var meta = [ev.horaire, ev.lieu, ev.precision]
      .filter(function (v) { return v && String(v).trim(); })
      .join(' · ');

    var corps = el('div', 'event__body');
    corps.append(el('div', 'event__title', ev.titre || 'Événement'));
    if (meta) { corps.append(el('div', 'event__meta', meta)); }

    var cta = el('a', 'btn btn--sm event__cta', "S'inscrire");
    cta.href = 'adherer.html';

    article.append(bloc, corps, cta);
    return article;
  }

  function afficherAgenda(cible, items) {
    if (!items.length) {
      message(cible, 'Aucun rendez-vous programmé pour le moment. ' +
                     'Revenez bientôt, le prochain est en préparation !');
      return;
    }

    var fragment = document.createDocumentFragment();
    var moisCourant = null;
    var groupe = null;

    items.forEach(function (item, index) {
      var cle = item.date.getFullYear() + '-' + item.date.getMonth();

      if (cle !== moisCourant) {
        moisCourant = cle;
        fragment.append(el('h2', 'agenda-month',
          MOIS[item.date.getMonth()] + ' ' + item.date.getFullYear()));
        groupe = el('div', 'events');
        fragment.append(groupe);
      }

      groupe.append(carteEvenement(item, index, false));
    });

    cible.replaceChildren(fragment);
  }

  function afficherApercu(cible, items) {
    if (!items.length) {
      message(cible, 'Le prochain rendez-vous sera annoncé très bientôt.');
      return;
    }

    var groupe = el('div', 'events');
    items.slice(0, 2).forEach(function (item, index) {
      groupe.append(carteEvenement(item, index, true));
    });
    cible.replaceChildren(groupe);
  }

  /* ---------------------------------------------------------------------
     Galerie
     --------------------------------------------------------------------- */

  // Rythme de la mosaïque, repris de la maquette : la 1re case occupe
  // 2 colonnes sur 2 rangées, les 5e et 8e occupent 2 colonnes. Le motif se
  // répète toutes les 8 photos pour rester équilibré quel qu'en soit le nombre.
  var MOTIF = ['g-w2 g-h2', '', '', '', 'g-w2', '', '', 'g-w2'];

  function classeFormat(photo, index) {
    if (photo.format === 'large') { return 'g-w2'; }
    if (photo.format === 'grande') { return 'g-w2 g-h2'; }
    if (photo.format === 'normale') { return ''; }
    return MOTIF[index % MOTIF.length];
  }

  function afficherGalerie(cible, donnees) {
    var photos = (donnees && donnees.photos ? donnees.photos : [])
      .filter(function (p) { return p && p.image; });

    // Aucune photo encore déposée : on garde les placeholders de la maquette
    if (!photos.length) {
      var fragment = document.createDocumentFragment();
      MOTIF.forEach(function (classe) {
        fragment.append(el('div', ('ph ' + classe).trim(), 'photo'));
      });
      cible.replaceChildren(fragment);
      return;
    }

    var grille = document.createDocumentFragment();
    photos.forEach(function (photo, index) {
      var img = document.createElement('img');
      img.src = photo.image;
      img.alt = photo.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      var classe = classeFormat(photo, index);
      if (classe) { img.className = classe; }
      grille.append(img);
    });
    cible.replaceChildren(grille);
  }

  /* ---------------------------------------------------------------------
     Photos des pages & bureau (assets/data/site.json)
     --------------------------------------------------------------------- */

  // Texte alternatif de chaque emplacement : décrit la scène attendue, pour
  // que l'admin n'ait pas à le saisir photo par photo.
  var ALT_PHOTOS = {
    accueil: 'Un moment de partage entre les générations',
    association: 'Les fondateurs de Cappellina lors des premiers ateliers',
    actions_ateliers: 'Un atelier numérique animé par des jeunes pour les aînés',
    actions_rencontres: 'Un goûter convivial réunissant plusieurs générations',
    actions_sorties: 'Une sortie de groupe organisée par l’association'
  };

  // Remplace la zone rayée par la vraie photo, en conservant ses classes de
  // mise en page (taille, arrondi). Sans photo, le placeholder reste en place.
  function remplacerPhoto(emplacement, chemin) {
    var cible = document.querySelector('[data-photo="' + emplacement + '"]');
    if (!cible || !chemin) { return; }

    var img = document.createElement('img');
    img.src = chemin;
    img.alt = ALT_PHOTOS[emplacement] || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = cible.className.replace(/\bph\b/, '').trim();

    cible.replaceWith(img);
  }

  function afficherBureau(cible, membres) {
    var liste = (membres || []).filter(function (m) { return m && (m.nom || m.role); });
    if (!liste.length) { return; }

    var fragment = document.createDocumentFragment();
    liste.forEach(function (membre) {
      var bloc = el('div', 'team__member');

      if (membre.photo) {
        var img = document.createElement('img');
        img.src = membre.photo;
        img.alt = membre.nom ? 'Portrait de ' + membre.nom : '';
        img.loading = 'lazy';
        img.className = 'team__photo';
        bloc.append(img);
      } else {
        bloc.append(el('div', 'ph team__photo', 'photo'));
      }

      bloc.append(el('div', 'team__name', membre.nom || 'Prénom Nom'));
      bloc.append(el('div', 'team__role', membre.role || ''));
      fragment.append(bloc);
    });

    cible.replaceChildren(fragment);
  }

  /* ---------------------------------------------------------------------
     Démarrage
     --------------------------------------------------------------------- */

  var listeAgenda = document.getElementById('agenda-liste');
  var apercuAgenda = document.getElementById('agenda-apercu');
  var grilleGalerie = document.getElementById('galerie-grille');

  if (listeAgenda || apercuAgenda) {
    chargerJSON('assets/data/agenda.json')
      .then(function (donnees) {
        var items = evenementsAVenir(donnees);
        if (listeAgenda) { afficherAgenda(listeAgenda, items); }
        if (apercuAgenda) { afficherApercu(apercuAgenda, items); }
      })
      .catch(function (erreur) {
        console.error('Agenda indisponible :', erreur);
        var texte = 'L’agenda n’a pas pu être chargé. ' +
                    'Écrivez-nous à contact@cappellina.fr pour connaître les prochains rendez-vous.';
        if (listeAgenda) { message(listeAgenda, texte); }
        if (apercuAgenda) { message(apercuAgenda, texte); }
      });
  }

  if (grilleGalerie) {
    chargerJSON('assets/data/galerie.json')
      .then(function (donnees) { afficherGalerie(grilleGalerie, donnees); })
      .catch(function (erreur) {
        console.error('Galerie indisponible :', erreur);
        message(grilleGalerie, 'Les photos n’ont pas pu être chargées. Réessayez plus tard.');
      });
  }

  var bureau = document.getElementById('bureau-liste');
  var emplacementsPhoto = document.querySelectorAll('[data-photo]');
  var logos = document.querySelectorAll('[data-logo]');
  var banniere = document.querySelector('[data-banniere]');

  if (bureau || emplacementsPhoto.length || logos.length || banniere) {
    chargerJSON('assets/data/site.json')
      .then(function (donnees) {
        // Logo et bannière : le HTML pointe déjà vers assets/logo-cappellina.png
        // et assets/banniere.jpg. Ces champs ne servent qu'à surcharger ces
        // chemins quand un fichier est envoyé depuis l'espace admin.
        var identite = (donnees && donnees.identite) || {};
        if (identite.logo) {
          logos.forEach(function (img) { poserSource(img, identite.logo); });
        }
        if (identite.banniere && banniere) {
          poserSource(banniere, identite.banniere);
        }

        var photos = (donnees && donnees.photos) || {};
        emplacementsPhoto.forEach(function (node) {
          remplacerPhoto(node.getAttribute('data-photo'), photos[node.getAttribute('data-photo')]);
        });
        if (bureau) { afficherBureau(bureau, donnees && donnees.bureau); }
      })
      .catch(function (erreur) {
        // Sans ce fichier, les placeholders de la maquette restent affichés :
        // la page reste correcte, elle est simplement moins illustrée.
        console.error('Contenus du site indisponibles :', erreur);
      });
  }
})();
