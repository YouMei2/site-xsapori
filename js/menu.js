/* =========================================================
   X-SAPORI — menu: filtri, ricerca, sezione attiva
   Senza JavaScript il menu resta un elenco completo e leggibile:
   filtri e ricerca sono un miglioramento, non un requisito.
   ========================================================= */
(function () {
  'use strict';

  var dishes = Array.prototype.slice.call(document.querySelectorAll('.dish'));
  if (!dishes.length) return;

  var EN = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0;
  var SEZIONI = document.querySelectorAll('.menu-course').length;

  var T = EN ? {
    completo: function (n) { return 'Full menu, ' + n + ' dishes.'; },
    nessuno: 'No dish matches the filters.',
    trovati: function (n) { return n + (n === 1 ? ' dish found.' : ' dishes found.'); },
    // Contatore a schermo: senza filtri racconta la varietà, con i filtri conta.
    vetrina: function (n) { return n + ' dishes · ' + SEZIONI + ' sections · 4 kitchens'; },
    parziale: function (v, t) { return v + ' of ' + t + ' dishes'; },
    vuoto: 'No dish matches'
  } : {
    completo: function (n) { return 'Menu completo, ' + n + ' piatti.'; },
    nessuno: 'Nessun piatto corrisponde ai filtri.',
    trovati: function (n) { return n + (n === 1 ? ' piatto trovato.' : ' piatti trovati.'); },
    vetrina: function (n) { return n + ' piatti · ' + SEZIONI + ' sezioni · 4 cucine'; },
    parziale: function (v, t) { return v + ' piatti su ' + t; },
    vuoto: 'Nessun piatto corrisponde'
  };

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
  var chipsCucina = Array.prototype.slice.call(document.querySelectorAll(".chip[data-cucina]"));
  var search = document.getElementById('menu-search');
  var status = document.getElementById('menu-status');
  var conteggio = document.getElementById('menu-conteggio');
  var noResults = document.getElementById('no-results');
  var reset = document.getElementById('reset-filters');
  var courses = Array.prototype.slice.call(document.querySelectorAll('.menu-course'));

  // Testo cercabile calcolato una volta sola.
  // La cucina sta sul piatto quando la sezione e mista (antipasti, dessert),
  // altrimenti la eredita dalla sezione. Le bevande non ne hanno nessuna:
  // accompagnano qualunque cucina e non spariscono mai per quel filtro.
  dishes.forEach(function (d) {
    d._testo = (d.textContent || '').toLowerCase();
    d._tags = (d.getAttribute('data-tags') || '').split(/\s+/);
    var corso = d.closest ? d.closest('.menu-course') : null;
    var c = d.getAttribute('data-cucina') ||
            (corso && corso.getAttribute('data-cucina')) || '';
    d._cucine = c ? c.split(/\s+/) : [];
  });

  var attivi = [];
  var cucine = [];
  var query = '';

  var normalizza = function (s) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')  // accenti: 'te' trova anche 'te'
      .trim();
  };

  var applica = function () {
    var visibili = 0;

    dishes.forEach(function (d) {
      var okTag = attivi.every(function (t) { return d._tags.indexOf(t) !== -1; });
      // OR fra le cucine scelte; un piatto senza cucina (le bevande) passa sempre
      var okCucina = !cucine.length || !d._cucine.length ||
        cucine.some(function (c) { return d._cucine.indexOf(c) !== -1; });
      var okTesto = !query || normalizza(d._testo).indexOf(query) !== -1;
      var mostra = okTag && okCucina && okTesto;
      d.hidden = !mostra;
      if (mostra) visibili++;
    });

    // Una sezione senza piatti visibili sparisce insieme al suo titolo
    courses.forEach(function (c) {
      var restano = c.querySelectorAll('.dish:not([hidden])').length;
      c.hidden = restano === 0;
    });

    if (noResults) noResults.hidden = visibili !== 0;

    var senzaFiltri = !attivi.length && !cucine.length && !query;

    if (status) {
      if (senzaFiltri) status.textContent = T.completo(dishes.length);
      else if (visibili === 0) status.textContent = T.nessuno;
      else status.textContent = T.trovati(visibili);
    }

    // Il contatore a schermo è aria-hidden: lo stato sopra lo annuncia già,
    // ripeterlo farebbe leggere due volte la stessa cosa.
    if (conteggio) {
      if (senzaFiltri) conteggio.textContent = T.vetrina(dishes.length);
      else if (visibili === 0) conteggio.textContent = T.vuoto;
      else conteggio.textContent = T.parziale(visibili, dishes.length);
      conteggio.dataset.filtrato = senzaFiltri ? 'false' : 'true';
    }
  };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var t = chip.getAttribute('data-filter');
      var i = attivi.indexOf(t);
      if (i === -1) { attivi.push(t); chip.setAttribute('aria-pressed', 'true'); }
      else { attivi.splice(i, 1); chip.setAttribute('aria-pressed', 'false'); }
      applica();
    });
  });

  chipsCucina.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var c = chip.getAttribute('data-cucina');
      var i = cucine.indexOf(c);
      if (i === -1) { cucine.push(c); chip.setAttribute('aria-pressed', 'true'); }
      else { cucine.splice(i, 1); chip.setAttribute('aria-pressed', 'false'); }
      applica();
    });
  });

  if (search) {
    var timer = null;
    search.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        query = normalizza(search.value);
        applica();
      }, 160);
    });
  }

  if (reset) {
    reset.addEventListener('click', function () {
      attivi = [];
      cucine = [];
      query = '';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chipsCucina.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      if (search) search.value = '';
      applica();
      if (search) search.focus();
    });
  }

  /* --- Sezione attiva nella barra ------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.menu-nav a'));
  if (!links.length) return;

  var segna = function (id) {
    links.forEach(function (a) {
      var attivo = a.getAttribute('href') === '#' + id;
      if (attivo) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) segna(e.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    courses.forEach(function (c) { spy.observe(c); });
  }

  // Il click deve segnare subito la sezione, senza aspettare lo scroll
  links.forEach(function (a) {
    a.addEventListener('click', function () { segna(a.getAttribute('href').slice(1)); });
  });
})();
