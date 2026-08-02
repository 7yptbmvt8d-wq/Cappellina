/* ==========================================================================
   Cappellina — comportements du site
   Menu mobile (burger)
   ========================================================================== */
(function () {
  'use strict';

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

})();
