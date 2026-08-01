/* ==========================================================================
   Cappellina — comportements du site
   1. Menu mobile (burger)
   2. Sélection du montant de don
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. Menu mobile
     ---------------------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav-principal');

  if (toggle && nav) {
    var setState = function (isOpen) {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    };

    var closeNav = function () {
      nav.classList.remove('is-open');
      setState(false);
    };

    toggle.addEventListener('click', function () {
      setState(nav.classList.toggle('is-open'));
    });

    // Refermer avec Échap, puis rendre le focus au bouton
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    // Refermer si l'on repasse en affichage bureau
    var desktop = window.matchMedia('(min-width: 901px)');
    var onChange = function (event) {
      if (event.matches) { closeNav(); }
    };

    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onChange);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(onChange); // Safari < 14
    }
  }

  /* ----------------------------------------------------------------------
     2. Sélection du montant de don
     Les boutons pré-sélectionnent un montant ; le champ « autre montant »
     désélectionne les boutons dès qu'il est renseigné.
     ---------------------------------------------------------------------- */
  var amounts = Array.prototype.slice.call(document.querySelectorAll('.amount'));
  var customAmount = document.getElementById('montant-libre');

  if (amounts.length) {
    amounts.forEach(function (button) {
      button.addEventListener('click', function () {
        amounts.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        if (customAmount) { customAmount.value = ''; }
      });
    });

    if (customAmount) {
      customAmount.addEventListener('input', function () {
        if (customAmount.value.trim() !== '') {
          amounts.forEach(function (button) {
            button.setAttribute('aria-pressed', 'false');
          });
        }
      });
    }
  }
})();
