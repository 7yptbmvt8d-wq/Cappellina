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

  // Les photos envoyées depuis l'admin arrivent telles quelles : un cliché de
  // téléphone pèse volontiers plusieurs mégaoctets. On les fait passer par le
  // service de transformation d'images de Netlify, qui les redimensionne et
  // les convertit en WebP à la volée. L'original reste intact dans le dépôt.
  //
  // En développement local le service n'existe pas : on garde le chemin brut.
  // Et si la transformation échoue en ligne, chaque image retombe d'elle-même
  // sur son fichier d'origine (voir imageOptimisee).
  var SERVICE_IMAGES = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
                    && location.protocol !== 'file:';

  function urlOptimisee(chemin, largeur) {
    if (!SERVICE_IMAGES || !/^\//.test(chemin)) { return chemin; }
    return '/.netlify/images?url=' + encodeURIComponent(chemin) +
           '&w=' + largeur + '&fm=webp&q=80';
  }

  // Crée une image optimisée qui revient au fichier d'origine en cas d'échec.
  function imageOptimisee(chemin, largeur, texte) {
    var img = document.createElement('img');
    img.alt = texte || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function auSecours() {
      img.removeEventListener('error', auSecours);
      img.src = chemin;
    });
    img.src = urlOptimisee(chemin, largeur);
    return img;
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

  // « accueil.qui_titre » → donnees.accueil.qui_titre, sans planter si une
  // étape du chemin manque.
  function valeurProfonde(objet, chemin) {
    return String(chemin).split('.').reduce(function (courant, cle) {
      return (courant && typeof courant === 'object') ? courant[cle] : undefined;
    }, objet);
  }

  // Écrit un texte en respectant les retours à la ligne saisis dans l'admin.
  // Les lignes sont posées en nœuds de texte séparés par des <br> : le contenu
  // reste du texte pur, aucune balise saisie ne peut prendre effet.
  function poserTexte(node, valeur) {
    var fragment = document.createDocumentFragment();
    String(valeur).split('\n').forEach(function (ligne, i) {
      if (i) { fragment.append(document.createElement('br')); }
      fragment.append(document.createTextNode(ligne));
    });
    node.replaceChildren(fragment);
  }

  // « 06 33 25 34 97 » → « tel:+33633253497 ». Le format international est le
  // seul que les mobiles composent correctement depuis l'étranger.
  function telHref(numero) {
    var chiffres = String(numero || '').replace(/[^\d+]/g, '');
    return 'tel:' + (/^0\d{9}$/.test(chiffres) ? '+33' + chiffres.slice(1) : chiffres);
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

    // Avec une billetterie renseignée dans l'admin, le bouton y mène
    // directement et s'ouvre à côté ; sinon il renvoie à la page de contact.
    var cta;
    if (ev.billetterie) {
      cta = el('a', 'btn btn--sm event__cta event__cta--billet', 'Réserver');
      cta.href = ev.billetterie;
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
      cta.setAttribute('aria-label',
        'Réserver ' + (ev.titre || 'cette activité') + ' (ouvre un nouvel onglet)');
    } else {
      cta = el('a', 'btn btn--sm event__cta', "S'inscrire");
      cta.href = 'adherer.html';
    }

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
      var classe = classeFormat(photo, index);
      // Une case sur 2 colonnes fait environ le double de large à l'écran
      var img = imageOptimisee(photo.image, classe ? 1400 : 760, photo.alt);
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
    actions_sorties: 'Une sortie de groupe organisée par l’association',
    actions_conferences: 'Une conférence tout public organisée par l’association',
    actions_soirees: 'Une soirée festive de l’association'
  };

  // Remplace la zone rayée par la vraie photo, en conservant ses classes de
  // mise en page (taille, arrondi). Sans photo, le placeholder reste en place.
  function remplacerPhoto(emplacement, chemin) {
    var cible = document.querySelector('[data-photo="' + emplacement + '"]');
    if (!cible || !chemin) { return; }

    var img = imageOptimisee(chemin, 900, ALT_PHOTOS[emplacement]);
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
        var img = imageOptimisee(membre.photo, 320,
          membre.nom ? 'Portrait de ' + membre.nom : '');
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
     Textes des pages (assets/data/textes.json)

     Chaque élément modifiable porte un attribut data-texte pointant vers une
     clé du fichier. Le texte reste écrit en clair dans le HTML : c'est lui que
     voient les visiteurs sans JavaScript et les moteurs de recherche au
     premier passage. Le fichier ne fait que le remplacer quand le bureau l'a
     modifié depuis l'admin.
     --------------------------------------------------------------------- */

  function appliquerTextes(donnees) {
    document.querySelectorAll('[data-texte]').forEach(function (node) {
      var valeur = valeurProfonde(donnees, node.getAttribute('data-texte'));
      // Un champ vidé dans l'admin laisse le texte d'origine plutôt que de
      // creuser un trou dans la page.
      if (typeof valeur === 'string' && valeur.trim()) { poserTexte(node, valeur); }
    });
  }

  /* ---------------------------------------------------------------------
     Coordonnées et liens (assets/data/reglages.json)
     --------------------------------------------------------------------- */

  // Renseignés depuis l'admin, ils servent aussi de destination par défaut aux
  // boutons « Réserver » des activités payantes.
  var LIENS = {};

  function appliquerReglages(donnees) {
    var contact = (donnees && donnees.contact) || {};
    LIENS = (donnees && donnees.liens) || {};

    if (contact.email) {
      document.querySelectorAll('[data-contact="email"]').forEach(function (a) {
        a.href = 'mailto:' + contact.email;
        a.textContent = contact.email;
      });
    }

    if (contact.telephone) {
      document.querySelectorAll('[data-contact="telephone"]').forEach(function (a) {
        a.href = telHref(contact.telephone);
        a.textContent = contact.telephone;
      });
    }

    // Liens externes : seule l'adresse change, le libellé reste celui de la page.
    document.querySelectorAll('[data-lien]').forEach(function (a) {
      var url = LIENS[a.getAttribute('data-lien')];
      if (url) { a.href = url; }
    });

    // Réseaux sociaux : tant qu'aucune adresse n'est renseignée, le nom reste
    // du simple texte — mieux qu'un lien qui ne mène nulle part.
    document.querySelectorAll('[data-reseau]').forEach(function (node) {
      var url = LIENS[node.getAttribute('data-reseau')];
      if (!url) { return; }
      var a = el('a', node.className || null, node.textContent);
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      node.replaceWith(a);
    });
  }

  /* ---------------------------------------------------------------------
     Activités (assets/data/activites.json)
     --------------------------------------------------------------------- */

  // Bibliothèque de pictogrammes. Ces chaînes sont des constantes écrites ici,
  // jamais du contenu saisi : l'admin ne fait que choisir un nom dans la liste.
  var ICONES = {
    jeux: '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.6"/><circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none"/>',
    calligraphie: '<path d="M15.5 3.2 20.8 8.5 10.6 18.7 4.5 20.5l1.8-6.1z"/><path d="M13.4 5.3 18.7 10.6"/><path d="M6.3 14.4l4.3 4.3"/>',
    palette: '<path d="M12 3.4a8.6 8.6 0 1 0 0 17.2c1.1 0 1.9-.8 1.9-1.8 0-.4-.2-.8-.5-1.1-.3-.3-.4-.6-.4-1 0-.9.7-1.5 1.6-1.5h1.3a4.7 4.7 0 0 0 4.7-4.7c0-3.9-3.9-7.1-8.6-7.1Z"/><circle cx="7.6" cy="11.6" r=".95" fill="currentColor" stroke="none"/><circle cx="9.7" cy="7.9" r=".95" fill="currentColor" stroke="none"/><circle cx="14" cy="7.6" r=".95" fill="currentColor" stroke="none"/>',
    panier: '<path d="M3.8 9.4h16.4l-1.5 9.4a2.1 2.1 0 0 1-2.1 1.8H7.4a2.1 2.1 0 0 1-2.1-1.8z"/><path d="M8 9.4a4 4 0 0 1 8 0"/><path d="M9.2 12.6v6M12 12.6v6M14.8 12.6v6"/><path d="M4.4 14.2h15.2"/>',
    ciseaux: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M19.8 4 8.7 16.3"/><path d="M4.2 4l11.1 12.3"/>',
    cahier: '<rect x="4.5" y="2.8" width="15" height="18.4" rx="2.6"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    raquette: '<ellipse cx="9.4" cy="8.8" rx="5.6" ry="6.6"/><path d="M9.4 15.4v4.2"/><path d="M7.6 20.6h3.6"/><circle cx="18.4" cy="16.2" r="3.1"/><circle cx="17.3" cy="15.2" r=".45" fill="currentColor" stroke="none"/><circle cx="19.6" cy="15.4" r=".45" fill="currentColor" stroke="none"/><circle cx="18.3" cy="17.6" r=".45" fill="currentColor" stroke="none"/>',
    musique: '<circle cx="6.4" cy="18" r="2.6"/><circle cx="16.6" cy="15.6" r="2.6"/><path d="M9 18V6.4l10.2-2.6v11.8"/><path d="M9 9.6 19.2 7"/>',
    velo: '<circle cx="5.6" cy="17" r="3.6"/><circle cx="18.4" cy="17" r="3.6"/><path d="M5.6 17 9.4 7.6h5.2L18.4 17"/><path d="M9.4 7.6h6.2"/><path d="M8.2 17h6.6"/><path d="M14.6 7.6 12 4.6"/>',
    randonnee: '<path d="M2.5 20.4h19"/><path d="M3.6 20.4 8.8 10.6l3.6 6.6 1.9-3 4.2 6.2"/><path d="M18.6 2.6c1.6 0 2.9 1.3 2.9 2.9 0 2.1-2.9 4.9-2.9 4.9s-2.9-2.8-2.9-4.9c0-1.6 1.3-2.9 2.9-2.9Z"/><circle cx="18.6" cy="5.5" r=".9"/>',
    groupe: '<circle cx="9" cy="8" r="3.2"/><path d="M3.4 20.2a5.6 5.6 0 0 1 11.2 0"/><circle cx="17.2" cy="9.6" r="2.4"/><path d="M16.4 15.2a4.6 4.6 0 0 1 4.2 5"/>',
    etoile: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z"/>'
  };

  // DOMParser plutôt qu'innerHTML : le pictogramme est construit comme un
  // document à part, puis importé. Aucune chaîne n'est interprétée dans la page.
  function pictogramme(nom) {
    var formes = ICONES[nom] || ICONES.etoile;
    var doc = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + formes + '</svg>', 'image/svg+xml');
    return document.importNode(doc.documentElement, true);
  }

  function carteActivite(act) {
    var article = el('article', 'activite');

    var entete = el('div', 'activite__entete');
    var icone = el('div', 'activite__icone icone--' + (act.couleur || 'sage'));
    icone.append(pictogramme(act.icone));
    entete.append(icone, el('h3', null, act.titre || ''));
    article.append(entete);

    if (act.description) { article.append(el('p', 'activite__desc', act.description)); }

    var infos = el('ul', 'activite__infos');
    if (act.lieu) { infos.append(el('li', 'info--lieu', act.lieu)); }

    (act.horaires || []).forEach(function (horaire) {
      if (horaire) { infos.append(el('li', 'info--horaire', horaire)); }
    });

    if (act.public) { infos.append(el('li', 'info--public', act.public)); }

    (act.contacts || []).forEach(function (contact) {
      if (!contact || (!contact.nom && !contact.telephone)) { return; }
      var li = el('li', 'info--tel');
      if (contact.nom) {
        li.append(document.createTextNode(contact.nom + (contact.telephone ? ' · ' : '')));
      }
      if (contact.telephone) {
        var lien = el('a', null, contact.telephone);
        lien.href = telHref(contact.telephone);
        li.append(lien);
      }
      infos.append(li);
    });

    if (infos.childElementCount) { article.append(infos); }

    // Règle du bureau : on réserve une activité payante, on s'inscrit à une
    // activité gratuite. Le bouton découle de la case « payante », il n'est
    // pas saisi séparément — impossible de les désaccorder.
    var action = el('p', 'activite__action');
    var bouton;

    if (act.payante) {
      bouton = el('a', 'btn btn--primary', 'Réserver une place');
      bouton.href = act.billetterie || LIENS.adhesion || 'adherer.html';
      bouton.target = '_blank';
      bouton.rel = 'noopener noreferrer';
      bouton.setAttribute('aria-label',
        'Réserver — ' + (act.titre || '') + ' (ouvre un nouvel onglet)');
    } else {
      // Apostrophe droite, comme dans le reste des pages : le rendu doit être
      // le sosie exact des fiches de secours écrites dans le HTML.
      bouton = el('a', 'btn btn--ghost', "S'inscrire");
      bouton.href = 'adherer.html';
      bouton.setAttribute('aria-label', "S'inscrire — " + (act.titre || ''));
    }

    action.append(bouton);
    article.append(action);
    return article;
  }

  /* ---------------------------------------------------------------------
     Rythme hebdomadaire (assets/data/agenda.json → « rythme »)

     Ces séances reviennent chaque semaine. Les lister date par date
     représenterait une cinquantaine de lignes qui n'apprendraient rien de plus
     que « tous les jeudis » : elles sont donc décrites une fois, et l'agenda
     daté ne porte que les rendez-vous ponctuels.
     --------------------------------------------------------------------- */

  var JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Un jour non reconnu passe en fin de liste plutôt qu'en tête.
  function rangJour(jour) {
    var i = JOURS.indexOf(jour);
    return i < 0 ? JOURS.length : i;
  }

  // Même règle que pour les activités : on réserve une séance payante, on
  // s'inscrit à une séance gratuite.
  function boutonSeance(seance) {
    var bouton;

    if (seance.payante) {
      bouton = el('a', 'btn btn--sm event__cta event__cta--billet', 'Réserver');
      bouton.href = seance.billetterie || LIENS.adhesion || 'adherer.html';
      bouton.target = '_blank';
      bouton.rel = 'noopener noreferrer';
      bouton.setAttribute('aria-label',
        'Réserver — ' + seance.titre + ' (ouvre un nouvel onglet)');
    } else {
      bouton = el('a', 'btn btn--sm event__cta', "S'inscrire");
      bouton.href = 'adherer.html';
      bouton.setAttribute('aria-label', "S'inscrire — " + seance.titre);
    }

    return bouton;
  }

  function afficherRythme(cible, donnees) {
    var seances = ((donnees && donnees.rythme) || [])
      .filter(function (s) { return s && s.titre; })
      // Rangées dans l'ordre de la semaine : une séance ajoutée un lundi se
      // place d'elle-même en tête, sans réordonner la liste dans l'admin.
      .sort(function (a, b) { return rangJour(a.jour) - rangJour(b.jour); });

    if (!seances.length) { return; }

    var liste = el('div', 'events');

    seances.forEach(function (seance) {
      var article = el('article', 'event event--rythme');

      var date = el('div', 'event__date');
      date.append(el('div', 'event__jour', seance.jour || ''));
      article.append(date);

      var corps = el('div', 'event__body');
      corps.append(el('div', 'event__title', seance.titre));

      var meta = [seance.horaire, seance.lieu, seance.precision]
        .filter(Boolean).join(' · ');
      if (meta) { corps.append(el('div', 'event__meta', meta)); }

      article.append(corps);
      article.append(boutonSeance(seance));
      liste.append(article);
    });

    cible.replaceChildren(liste);
  }

  function afficherActivites(cible, donnees) {
    var familles = (donnees && donnees.familles) || [];
    if (!familles.length) { return; }

    var fragment = document.createDocumentFragment();

    familles.forEach(function (famille, index) {
      var section = el('section', 'section');
      section.append(el('h2', 'section-title section-title--sm', famille.titre || ''));
      if (famille.lieu) { section.append(el('p', 'famille-lieu', famille.lieu)); }

      var grille = el('div', 'activites');
      (famille.activites || []).forEach(function (act) {
        if (act && act.titre) { grille.append(carteActivite(act)); }
      });
      section.append(grille);

      var wrap = el('div', 'wrap');
      wrap.append(section);

      // Une famille sur deux est posée sur un fond coloré, comme dans la maquette.
      if (index % 2) {
        var bande = el('div', 'band');
        bande.append(wrap);
        fragment.append(bande);
      } else {
        fragment.append(wrap);
      }
    });

    cible.replaceChildren(fragment);
  }

  /* ---------------------------------------------------------------------
     Démarrage
     --------------------------------------------------------------------- */

  var listeAgenda = document.getElementById('agenda-liste');
  var apercuAgenda = document.getElementById('agenda-apercu');
  var blocRythme = document.getElementById('agenda-rythme');
  var grilleGalerie = document.getElementById('galerie-grille');
  var blocActivites = document.getElementById('activites-familles');

  if (document.querySelector('[data-texte]')) {
    chargerJSON('assets/data/textes.json')
      .then(appliquerTextes)
      .catch(function (erreur) {
        // Sans ce fichier la page garde les textes écrits dans le HTML :
        // elle reste complète, simplement figée à la dernière mise en ligne.
        console.error('Textes des pages indisponibles :', erreur);
      });
  }

  // Les réglages passent en premier : les boutons « Réserver » d'une séance ou
  // d'une activité sans billetterie propre retombent sur le lien d'adhésion,
  // qui vient de ce fichier. Les deux rendus qui en dépendent l'attendent donc.
  chargerJSON('assets/data/reglages.json')
    .then(appliquerReglages)
    .catch(function (erreur) {
      console.error('Coordonnées et liens indisponibles :', erreur);
    })
    .then(function () {
      if (blocActivites) {
        chargerJSON('assets/data/activites.json')
          .then(function (donnees) { afficherActivites(blocActivites, donnees); })
          .catch(function (erreur) {
            // Les fiches écrites dans le HTML restent affichées.
            console.error('Activités indisponibles :', erreur);
          });
      }

      if (!listeAgenda && !apercuAgenda && !blocRythme) { return; }

      chargerJSON('assets/data/agenda.json')
        .then(function (donnees) {
          if (blocRythme) { afficherRythme(blocRythme, donnees); }

          var items = evenementsAVenir(donnees);
          if (listeAgenda) { afficherAgenda(listeAgenda, items); }
          if (apercuAgenda) { afficherApercu(apercuAgenda, items); }
        })
        .catch(function (erreur) {
          console.error('Agenda indisponible :', erreur);
          // Le planning hebdomadaire écrit dans le HTML reste affiché ; seuls
          // les rendez-vous datés, qui n'ont pas de repli, sont annoncés absents.
          var texte = 'L’agenda n’a pas pu être chargé. ' +
                      'Écrivez-nous à cappellina2b@gmail.com pour connaître les prochains rendez-vous.';
          if (listeAgenda) { message(listeAgenda, texte); }
          if (apercuAgenda) { message(apercuAgenda, texte); }
        });
    });

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
