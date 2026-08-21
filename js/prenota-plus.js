/**
 * X-Sapori — arricchimenti del modulo di prenotazione.
 *
 * Tutto qui dentro è ARRICCHIMENTO PROGRESSIVO: il modulo in pagina resta
 * quello che funziona già, con i suoi campi nativi e i suoi name. Questo
 * script li sostituisce a schermo con controlli più comodi e riscrive i
 * valori dentro i campi originali. Se il file non viene caricato, o il
 * JavaScript è spento, la prenotazione funziona esattamente come prima.
 *
 * Nessun campo nuovo viene inviato al server: il numero di bambini viaggia
 * dentro le note, che il backend già salva e mostra al personale. Così non
 * serve toccare né il database né api/booking.php.
 */
(function () {
  'use strict';

  var form = document.getElementById('booking-form');
  if (!form) { return; }

  var EN = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0;

  var T = EN ? {
    pranzo: 'Lunch', cena: 'Dinner',
    adulti: 'Adults', bambini: 'Children', bambiniNota: 'under 120 cm',
    meno: 'One fewer', piu: 'One more',
    orarioLegenda: 'Arrival time',
    durataPranzo: 'At lunch the table is held for 90 minutes.',
    durataCena: 'At dinner the table is yours for the whole evening.',
    totale: 'Estimated total',
    bevande: 'drinks excluded',
    adulto: 'adult', adultiPl: 'adults', bambino: 'child', bambiniPl: 'children',
    composizione: function (a, b) {
      return 'Party: ' + a + ' ' + (a === 1 ? 'adult' : 'adults') +
             ' and ' + b + ' ' + (b === 1 ? 'child' : 'children') + ' under 120 cm.';
    }
  } : {
    pranzo: 'Pranzo', cena: 'Cena',
    adulti: 'Adulti', bambini: 'Bambini', bambiniNota: 'sotto i 120 cm',
    meno: 'Uno in meno', piu: 'Uno in più',
    orarioLegenda: 'Orario di arrivo',
    durataPranzo: 'A pranzo il tavolo si tiene 90 minuti.',
    durataCena: 'A cena il tavolo è vostro per tutta la serata.',
    totale: 'Totale stimato',
    bevande: 'bevande escluse',
    adulto: 'adulto', adultiPl: 'adulti', bambino: 'bambino', bambiniPl: 'bambini',
    composizione: function (a, b) {
      return 'Siamo ' + a + ' ' + (a === 1 ? 'adulto' : 'adulti') +
             ' e ' + b + ' ' + (b === 1 ? 'bambino' : 'bambini') + ' sotto i 120 cm.';
    }
  };

  // Listini: devono restare allineati a index.html e a config.php.
  var PREZZI = {
    pranzo_feriale: { adulto: 14.90, bambino: 9.90 },
    cena_feriale:   { adulto: 22.90, bambino: 12.90 },
    pranzo_weekend: { adulto: 18.90, bambino: 9.90 },
    cena_weekend:   { adulto: 24.90, bambino: 12.90 }
  };

  var FASCE = {
    pranzo: ['12:00', '12:30', '13:00', '13:30', '14:00'],
    cena:   ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
  };

  var campoOrario = form.elements.namedItem('orario');
  var campoPersone = form.elements.namedItem('persone');
  var campoFormula = form.elements.namedItem('formula');
  var campoNote = form.elements.namedItem('note');
  if (!campoOrario || !campoPersone) { return; }

  var adulti = Math.max(1, parseInt(campoPersone.value, 10) || 2);
  var bambini = 0;

  // Dichiarato qui e non più in basso: le funzioni sono sollevate, le
  // assegnazioni no, e il blocco dei contatori gira prima.
  var contatori = [];

  /* --- Fasce orarie ---------------------------------------------------
   * Il campo <input type="time"> resta nel documento e continua a essere
   * quello che viene inviato: lo nascondiamo e lo pilotiamo dai pulsanti.
   * Un campo orario libero fa arrivare richieste per le 14:52.
   * ------------------------------------------------------------------ */
  var contenitoreOrario = campoOrario.closest('.field');
  if (contenitoreOrario) {
    campoOrario.hidden = true;
    campoOrario.setAttribute('aria-hidden', 'true');
    campoOrario.tabIndex = -1;

    var gruppo = document.createElement('div');
    gruppo.className = 'fasce';
    gruppo.setAttribute('role', 'group');
    gruppo.setAttribute('aria-label', T.orarioLegenda);

    var durata = document.createElement('p');
    durata.className = 'hint fasce__durata';

    var bottoni = [];

    var disegnaFasce = function () {
      gruppo.innerHTML = '';
      bottoni = [];

      ['pranzo', 'cena'].forEach(function (turno) {
        var riga = document.createElement('div');
        riga.className = 'fasce__riga';

        var etichetta = document.createElement('span');
        etichetta.className = 'fasce__turno';
        etichetta.textContent = T[turno];
        riga.appendChild(etichetta);

        FASCE[turno].forEach(function (ora) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'fascia';
          b.textContent = ora;
          b.dataset.ora = ora;
          b.dataset.turno = turno;
          b.setAttribute('aria-pressed', String(campoOrario.value === ora));
          b.addEventListener('click', function () { scegli(ora, turno); });
          riga.appendChild(b);
          bottoni.push(b);
        });

        gruppo.appendChild(riga);
      });
    };

    var scegli = function (ora, turno) {
      campoOrario.value = ora;
      bottoni.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.ora === ora));
      });
      durata.textContent = turno === 'pranzo' ? T.durataPranzo : T.durataCena;
      // 'change' fa scattare la sincronizzazione della formula in booking.js
      campoOrario.dispatchEvent(new Event('change', { bubbles: true }));
      aggiornaTotale();
    };

    disegnaFasce();
    contenitoreOrario.appendChild(gruppo);
    contenitoreOrario.appendChild(durata);
  }

  /* --- Contatori adulti e bambini -------------------------------------
   * Il campo "persone" continua a ricevere il TOTALE, come si aspetta il
   * server. I bambini finiscono nelle note al momento dell'invio.
   * ------------------------------------------------------------------ */
  var contenitorePersone = campoPersone.closest('.field');
  var etichettaTotale = null;

  if (contenitorePersone) {
    campoPersone.hidden = true;
    campoPersone.setAttribute('aria-hidden', 'true');
    campoPersone.tabIndex = -1;

    var vecchiaEtichetta = contenitorePersone.querySelector('label');
    if (vecchiaEtichetta) { vecchiaEtichetta.hidden = true; }

    var costruisciContatore = function (nome, nota, valore, minimo, alCambio) {
      var box = document.createElement('div');
      box.className = 'contatore';

      var testo = document.createElement('span');
      testo.className = 'contatore__nome';
      testo.innerHTML = nome + (nota ? ' <small>' + nota + '</small>' : '');

      var comandi = document.createElement('div');
      comandi.className = 'contatore__comandi';

      var meno = document.createElement('button');
      meno.type = 'button';
      meno.className = 'contatore__btn';
      meno.textContent = '−';
      meno.setAttribute('aria-label', T.meno + ': ' + nome);

      var numero = document.createElement('output');
      numero.className = 'contatore__valore';
      numero.textContent = String(valore);
      numero.setAttribute('aria-live', 'polite');
      numero.setAttribute('aria-label', nome);

      var piu = document.createElement('button');
      piu.type = 'button';
      piu.className = 'contatore__btn';
      piu.textContent = '+';
      piu.setAttribute('aria-label', T.piu + ': ' + nome);

      var stato = valore;

      // Prima si applica il nuovo valore, poi si ricalcolano i limiti di
      // entrambi i contatori: al contrario il pulsante «+» resterebbe
      // attivo per un giro di troppo al raggiungimento del massimo.
      var mostra = function () {
        numero.textContent = String(stato);
        alCambio(stato);
        aggiornaLimiti();
      };

      box._limiti = function () {
        meno.disabled = stato <= minimo;
        piu.disabled = (adulti + bambini) >= 40;
      };

      meno.addEventListener('click', function () {
        if (stato > minimo) { stato--; mostra(); }
      });
      piu.addEventListener('click', function () {
        if (adulti + bambini < 40) { stato++; mostra(); }
      });

      comandi.appendChild(meno);
      comandi.appendChild(numero);
      comandi.appendChild(piu);
      box.appendChild(testo);
      box.appendChild(comandi);

      return box;
    };

    var gruppoContatori = document.createElement('div');
    gruppoContatori.className = 'contatori';

    var boxAdulti = costruisciContatore(T.adulti, '', adulti, 1, function (v) {
      adulti = v; sincronizza();
    });
    var boxBambini = costruisciContatore(T.bambini, T.bambiniNota, bambini, 0, function (v) {
      bambini = v; sincronizza();
    });

    contatori.push(boxAdulti, boxBambini);
    gruppoContatori.appendChild(boxAdulti);
    gruppoContatori.appendChild(boxBambini);
    aggiornaLimiti();

    etichettaTotale = document.createElement('p');
    etichettaTotale.className = 'stima';

    contenitorePersone.appendChild(gruppoContatori);
    contenitorePersone.appendChild(etichettaTotale);
  }

  function aggiornaLimiti() {
    contatori.forEach(function (b) { if (b._limiti) { b._limiti(); } });
  }

  function sincronizza() {
    campoPersone.value = String(adulti + bambini);
    aggiornaTotale();
  }

  /* --- Totale stimato --------------------------------------------------
   * È il conto che il cliente sta già facendo con la calcolatrice del
   * telefono. Farlo per lui toglie l'ultima esitazione prima dell'invio.
   * ------------------------------------------------------------------ */
  function aggiornaTotale() {
    if (!etichettaTotale) { return; }

    var listino = PREZZI[campoFormula ? campoFormula.value : 'cena_feriale'];
    if (!listino) { etichettaTotale.textContent = ''; return; }

    var totale = adulti * listino.adulto + bambini * listino.bambino;
    var euro = function (n) {
      return EN ? '€' + n.toFixed(2) : n.toFixed(2).replace('.', ',') + ' €';
    };

    var pezzi = [adulti + ' × ' + euro(listino.adulto)];
    if (bambini > 0) { pezzi.push(bambini + ' × ' + euro(listino.bambino)); }

    etichettaTotale.innerHTML =
      '<span class="stima__voci">' + pezzi.join(' + ') + '</span>' +
      '<strong class="stima__totale">' + T.totale + ' ' + euro(totale) + '</strong>' +
      '<span class="stima__nota">' + T.bevande + '</span>';
  }

  if (campoFormula) {
    campoFormula.addEventListener('change', aggiornaTotale);
  }
  // la formula si aggiorna da sola anche cambiando la data
  var campoData = form.elements.namedItem('data');
  if (campoData) { campoData.addEventListener('change', function () { window.setTimeout(aggiornaTotale, 0); }); }

  aggiornaTotale();

  /* --- Composizione del tavolo dentro le note --------------------------
   * L'ascolto è in fase di CATTURA sul documento: così questo handler gira
   * prima di quello di booking.js, che sta sul form ed è in fase di bolla.
   * Senza questo accorgimento la nota partirebbe senza la riga aggiunta.
   * ------------------------------------------------------------------ */
  // Riconosce una riga aggiunta da noi in un invio precedente. Serve perché
  // se il primo invio fallisce (limite anti-spam, errore di rete) la riga
  // resta nelle note: cambiando i contatori e riprovando ne comparirebbe una
  // seconda con numeri diversi, e in sala leggerebbero due composizioni in
  // contraddizione.
  var RIGA_AUTOMATICA = EN
    ? /\s*Party: \d+ (?:adult|adults) and \d+ (?:child|children) under 120 cm\./g
    : /\s*Siamo \d+ (?:adulto|adulti) e \d+ (?:bambino|bambini) sotto i 120 cm\./g;

  document.addEventListener('submit', function (e) {
    if (e.target !== form || !campoNote) { return; }

    // si riparte sempre dal solo testo scritto dal cliente
    var testo = (campoNote.value || '').replace(RIGA_AUTOMATICA, '').trim();

    if (bambini > 0) {
      var riga = T.composizione(adulti, bambini);
      var nuovo = testo ? testo + '\n\n' + riga : riga;
      // il server accetta 1000 caratteri: se non ci stanno, vince il cliente
      if (nuovo.length <= 1000) { testo = nuovo; }
    }

    campoNote.value = testo;
  }, true);
})();
