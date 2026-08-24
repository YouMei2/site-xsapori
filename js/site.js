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
    apertoOra:   'Open now / closes at ',
    chiusoRiapre:'Closed / opens at ',
    chiusoDomani:'Closed / opens tomorrow at '
  } : {
    apertoOra:   'Aperto ora / si chiude alle ',
    chiusoRiapre:'Chiuso / riapre alle ',
    chiusoDomani:'Chiuso / riapre domani alle '
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

  /* --- Video di sfondo nell'hero --------------------------
   * Il video si attiva solo se il contenitore .hero__bg dichiara
   * data-video. Finché quell'attributo non c'è, questa parte non fa
   * nulla e l'hero resta esattamente com'è: una fotografia.
   *
   * Il video non parte mai quando:
   *   - il visitatore ha chiesto di ridurre il movimento;
   *   - il telefono è in risparmio dati;
   *   - la connessione è 2G o 3G lenta.
   * In tutti questi casi resta la foto, che è anche il poster.
   *
   * WCAG 2.2.2: un contenuto in movimento che dura più di cinque
   * secondi deve poter essere fermato. Per questo compare il pulsante
   * di pausa: senza, un video in loop sarebbe una violazione.
   * ------------------------------------------------------ */
  // Basta uno dei due formati: chi fornisce solo il WebM deve funzionare
  // esattamente come chi fornisce solo l'MP4.
  var sfondo = document.querySelector('.hero__bg[data-video], .hero__bg[data-video-webm]');
  if (sfondo) {
    var rete = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var reteLenta = !!rete && (rete.saveData === true ||
      ['slow-2g', '2g', '3g'].indexOf(rete.effectiveType) !== -1);

    if (!reduced && !reteLenta) {
      var poster = sfondo.querySelector('img');
      var video = document.createElement('video');

      video.className = 'hero__video';
      video.muted = true;            // senza questo l'autoplay viene bloccato
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;      // su iPhone evita l'apertura a tutto schermo
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      video.tabIndex = -1;
      video.setAttribute('aria-hidden', 'true');
      if (poster) { video.poster = poster.currentSrc || poster.src; }

      var sorgenti = 0;
      [['data-video-webm', 'video/webm'], ['data-video', 'video/mp4']].forEach(function (coppia) {
        var url = sfondo.getAttribute(coppia[0]);
        if (!url) { return; }
        var s = document.createElement('source');
        s.src = url;
        s.type = coppia[1];
        // L'errore di caricamento arriva sul <source>, non sul <video>:
        // ascoltarlo solo sul video lascerebbe in pagina un elemento morto.
        s.addEventListener('error', function () {
          sorgenti--;
          if (sorgenti <= 0) { pulisci(); }
        });
        video.appendChild(s);
        sorgenti++;
      });

      var comando = document.createElement('button');
      comando.type = 'button';
      comando.className = 'hero__video-pausa';
      comando.hidden = true;

      // Se il video non si carica si torna alla sola fotografia, senza
      // lasciare in pagina elementi inutili.
      var pulisci = function () {
        delete sfondo.dataset.videoAttivo;
        video.remove();
        comando.remove();
      };

      var ETICHETTE = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0
        ? { pausa: 'Pause the background video', riprendi: 'Play the background video' }
        : { pausa: 'Metti in pausa il video di sfondo', riprendi: 'Riprendi il video di sfondo' };

      var segnaStato = function () {
        var fermo = video.paused;
        comando.setAttribute('aria-label', fermo ? ETICHETTE.riprendi : ETICHETTE.pausa);
        comando.dataset.fermo = String(fermo);
      };

      comando.addEventListener('click', function () {
        if (video.paused) { video.play(); } else { video.pause(); }
        segnaStato();
      });
      video.addEventListener('play', segnaStato);
      video.addEventListener('pause', segnaStato);

      // Il pulsante compare solo quando il video parte davvero: se il file
      // manca o il browser rifiuta l'autoplay, resta la foto e nient'altro.
      video.addEventListener('playing', function () {
        sfondo.dataset.videoAttivo = 'true';
        comando.hidden = false;
        segnaStato();
      }, { once: true });

      video.addEventListener('error', pulisci);

      sfondo.appendChild(video);
      sfondo.appendChild(comando);

      var avvio = video.play();
      if (avvio && typeof avvio.catch === 'function') {
        avvio.catch(function () { /* autoplay negato: resta la foto */ });
      }
    }
  }

  /* --- Barra fissa su mobile ------------------------------ */
  // Appare quando l'hero è uscito dallo schermo e si ritira quando entra
  // il footer, così non copre mai indirizzo e telefono in fondo.
  var barra = document.getElementById('barra-fissa');
  if (barra) {
    var heroBarra = document.querySelector('.hero');
    var piede = document.querySelector('.site-footer');
    var attesa = false;

    var valuta = function () {
      var oltreHero = heroBarra
        ? window.scrollY > heroBarra.offsetHeight - 120
        : window.scrollY > 400;

      var piedeVicino = false;
      if (piede) {
        var r = piede.getBoundingClientRect();
        piedeVicino = r.top < window.innerHeight - 40;
      }

      barra.dataset.visibile = (oltreHero && !piedeVicino) ? 'true' : 'false';
      attesa = false;
    };

    window.addEventListener('scroll', function () {
      if (attesa) return;
      attesa = true;
      window.requestAnimationFrame(valuta);
    }, { passive: true });
    window.addEventListener('resize', valuta, { passive: true });
    valuta();
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

  /* --- La mappa non ha piu' bisogno di codice ---------------
   * Prima qui c'era il blocco che, dopo il consenso, inseriva un iframe di
   * Google. Ora la mappa e' fatta di riquadri di OpenStreetMap ospitati da
   * noi: si vede subito, non parte nessuna richiesta verso terzi e non c'e'
   * niente da consentire. Percio' non serve nessun JavaScript, e la mappa
   * si vede anche a JavaScript spento.
   * ------------------------------------------------------- */
})();
