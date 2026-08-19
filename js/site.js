/* =========================================================
   X-SAPORI — comportamenti comuni a tutte le pagine
   Nessuna libreria. Il sito resta usabile anche senza questo file.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lingua della pagina: l'unica differenza fra le due versioni del sito
  // sono i testi generati da qui, tutto il resto e identico.
  var EN = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0;
  var T = EN ? {
    apertoOra:   'Open now · closes at ',
    chiusoRiapre:'Closed · opens at ',
    chiusoDomani:'Closed · opens tomorrow at ',
    mappaTitolo: 'Map: X-Sapori, Via Luigi Pirandello 2r, Savona'
  } : {
    apertoOra:   'Aperto ora · si chiude alle ',
    chiusoRiapre:'Chiuso · riapre alle ',
    chiusoDomani:'Chiuso · riapre domani alle ',
    mappaTitolo: 'Mappa: X-Sapori, Via Luigi Pirandello 2r, Savona'
  };

  /* --- Header: compatto allo scroll ---------------------- */
  var header = document.getElementById('site-header');
  if (header) {
    var hero = document.querySelector('.hero');
    var ticking = false;

    var update = function () {
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 24);
      // Sopra l'hero scuro il logo e i link restano chiari
      if (hero) {
        var limit = hero.offsetHeight - header.offsetHeight - 24;
        header.classList.toggle('site-header--over-dark', y < limit);
      }
      ticking = false;
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* --- Menu mobile ---------------------------------------- */
  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('drawer');
  if (toggle && drawer) {
    var close = document.getElementById('drawer-close');
    var lastFocus = null;

    var openDrawer = function () {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      // due frame: il browser deve registrare hidden=false prima della transizione
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { drawer.dataset.open = 'true'; });
      });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      (close || drawer.querySelector('a')).focus();
    };

    var closeDrawer = function () {
      drawer.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () { drawer.hidden = true; }, reduced ? 0 : 380);
      if (lastFocus) lastFocus.focus();
    };

    toggle.addEventListener('click', openDrawer);
    if (close) close.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') closeDrawer();
    });
    // Il focus non deve uscire dal pannello aperto
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || drawer.dataset.open !== 'true') return;
      var items = drawer.querySelectorAll('a, button');
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* --- Comparsa delle sezioni allo scroll ----------------- */
  var items = document.querySelectorAll('.reveal');
  if (!items.length) { /* niente da fare */ }
  else if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });

    // Rete di sicurezza: se l'observer non risponde (browser particolari,
    // pagina non composita) mostriamo tutto invece di lasciare il vuoto.
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;pointer-events:none';
    document.body.appendChild(sentinel);

    var sentinelFired = false;
    var probe = new IntersectionObserver(function () { sentinelFired = true; });
    probe.observe(sentinel);

    window.setTimeout(function () {
      probe.disconnect();
      sentinel.remove();
      if (sentinelFired) return;
      items.forEach(function (el) { el.classList.add('is-in'); });
    }, 1200);
  }

  /* --- "Aperto ora" calcolato sull'ora di Roma ------------ */
  var stato = document.getElementById('stato-apertura');
  if (stato) {
    var testo = document.getElementById('stato-testo');
    var SERVIZI = [{ da: 12 * 60, a: 15 * 60 }, { da: 19 * 60, a: 23 * 60 }];

    var minutiARoma = function () {
      var parts = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      return h * 60 + m;
    };

    var orario = function (min) {
      var h = Math.floor(min / 60), m = min % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    };

    var aggiorna = function () {
      var ora = minutiARoma();
      var aperto = SERVIZI.filter(function (s) { return ora >= s.da && ora < s.a; })[0];

      if (aperto) {
        stato.dataset.open = 'true';
        testo.textContent = T.apertoOra + orario(aperto.a);
        return;
      }
      var prossimo = SERVIZI.filter(function (s) { return s.da > ora; })[0];
      stato.dataset.open = 'false';
      testo.textContent = prossimo
        ? T.chiusoRiapre + orario(prossimo.da)
        : T.chiusoDomani + orario(SERVIZI[0].da);
    };

    aggiorna();
    window.setInterval(aggiorna, 60000);
  }

  /* --- Mappa caricata solo su richiesta ------------------- */
  var caricaMappa = document.getElementById('mappa-load');
  if (caricaMappa) {
    caricaMappa.addEventListener('click', function () {
      var box = document.getElementById('mappa');
      var consent = document.getElementById('mappa-consent');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/maps?q=Via+Luigi+Pirandello+2r,+17100+Savona&output=embed';
      iframe.title = T.mappaTitolo;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      if (consent) consent.remove();
      box.appendChild(iframe);
    });
  }
})();
