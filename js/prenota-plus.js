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
    aPersona: 'per person',
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
    aPersona: 'a persona',
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

  // Le fasce vanno ridisegnate quando cambia la data, altrimenti il prezzo
  // in testa al turno resta quello del giorno precedente. Assegnata dentro
  // il blocco delle fasce, chiamata dal listener della data piu' in basso.
  var ridisegnaFasce = null;

  /* --- Fasce orarie ---------------------------------------------------
   * Il campo <input type="time"> resta nel documento e continua a essere
   * quello che viene inviato: lo nascondiamo e lo pilotiamo dai pulsanti.
   * Un campo orario libero fa arrivare richieste per le 14:52.
   * ------------------------------------------------------------------ */
  // Serve sia alle fasce (per il prezzo del turno) sia al biglietto.
  function euroBreve(n) {
    return EN ? '€' + n.toFixed(2) : n.toFixed(2).replace('.', ',') + ' €';
  }
  function weekendScelto() {
    var c = form.elements.namedItem('data');
    if (!c || !c.value) { return false; }
    var d = new Date(c.value + 'T12:00:00');
    if (isNaN(d)) { return false; }
    var g = d.getDay();
    return g === 0 || g === 6;
  }

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

        /* Nome del turno e prezzo dentro una loro intestazione, non sciolti
         * nella riga flex: sciolti, i pulsanti si accodavano sulla stessa
         * riga e gli undici finivano su quattro righe invece che su due.
         * Misurato: label, prezzo e quattro pulsanti tutti a top=872. */
        var cap = document.createElement('div');
        cap.className = 'fasce__cap';

        var etichetta = document.createElement('span');
        etichetta.className = 'fasce__turno';
        etichetta.textContent = T[turno];
        cap.appendChild(etichetta);

        /* Il prezzo del turno, accanto al nome. Pranzo e cena costano
         * diverso, e il weekend costa piu' dei feriali: vederlo PRIMA di
         * scegliere l'orario evita la sorpresa dopo. Si aggiorna da solo
         * quando cambia la data, perche' `disegnaFasce` viene richiamata. */
        var prezzo = document.createElement('span');
        prezzo.className = 'fasce__prezzo';
        var chiave = turno + (weekendScelto() ? '_weekend' : '_feriale');
        if (PREZZI[chiave]) {
          prezzo.textContent = euroBreve(PREZZI[chiave].adulto) + ' ' + T.aPersona;
        }
        cap.appendChild(prezzo);
        riga.appendChild(cap);

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
    ridisegnaFasce = disegnaFasce;
    contenitoreOrario.appendChild(gruppo);
    contenitoreOrario.appendChild(durata);

    /* IL CAMPO ORARIO ESCE DALLA GRIGLIA A TRE COLONNE.
     * Nel markup sta accanto a Data e Persone, perche' senza JavaScript e'
     * un `<input type="time">` largo un terzo e va benissimo cosi'. Ma qui
     * sopra e' appena diventato undici pulsanti, e undici pulsanti in un
     * terzo di colonna si incolonnano uno per riga: misurato, 72px di
     * larghezza e tutti i bottoni a x=220. Diventava una lista verticale
     * lunga mezza pagina.
     *
     * Lo spostiamo quindi fuori dalla griglia, subito dopo, dove ha tutta
     * la larghezza del modulo. Lo facciamo qui e non nel CSS perche' e'
     * vero solo quando i pulsanti esistono davvero. */
    var griglia = contenitoreOrario.parentElement;
    if (griglia && griglia.classList.contains('field-grid')) {
      griglia.parentNode.insertBefore(contenitoreOrario, griglia.nextSibling);
      contenitoreOrario.classList.add('field--fasce');
      griglia.classList.add('field-grid--senza-orario');
    }
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
      // `verso` serve solo all'animazione: il numero scatta nella direzione
      // del comando, cosi' si capisce che il tocco e' andato a segno senza
      // dover guardare la cifra. L'attributo si toglie da solo, altrimenti
      // due tocchi di fila nella stessa direzione non rianimerebbero nulla.
      var mostra = function (verso) {
        numero.textContent = String(stato);
        if (verso) {
          numero.removeAttribute('data-mosso');
          void numero.offsetWidth;          // forza il riavvio dell'animazione
          numero.setAttribute('data-mosso', verso);
        }
        alCambio(stato);
        aggiornaLimiti();
      };

      box._limiti = function () {
        meno.disabled = stato <= minimo;
        piu.disabled = (adulti + bambini) >= 40;
      };

      meno.addEventListener('click', function () {
        if (stato > minimo) { stato--; mostra('giu'); }
      });
      piu.addEventListener('click', function () {
        if (adulti + bambini < 40) { stato++; mostra('su'); }
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

    /* Se in pagina c'e' il biglietto, il totale sta li' e questa riga
     * sarebbe un doppione: lo stesso numero scritto due volte a mezzo
     * schermo di distanza, e il lettore si chiede quale dei due vale.
     * Resta nel DOM — `aggiornaTotale` la riempie e da li' parte
     * l'aggiornamento del biglietto — ma diventa invisibile e viene tolta
     * anche agli screen reader, che leggono il biglietto (`aria-live`).
     * Senza biglietto, o senza il markup che lo contiene, resta com'era. */
    if (document.getElementById('biglietto')) {
      etichettaTotale.classList.add('stima--doppione');
      etichettaTotale.setAttribute('aria-hidden', 'true');
    }

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
      '<strong class="stima__totale" data-aggiornato="true">' + T.totale + ' ' + euro(totale) + '</strong>' +
      '<span class="stima__nota">' + T.bevande + '</span>';

    aggiornaBiglietto(totale, euro);
  }

  /* --- Il biglietto del tavolo -----------------------------------------
   * Lo stesso conto, ma come oggetto invece che come riga di testo persa in
   * mezzo al modulo: si compone mentre si compila, e su un modulo da dodici
   * campi vedere crescere qualcosa toglie l'impressione del muro.
   *
   * Non calcola niente per conto suo: legge i valori che questo file ha
   * gia'. Se il biglietto non c'e' nel markup, tutto il resto funziona
   * identico — e senza JavaScript non compare affatto, il che va bene:
   * i dati sono tutti nei campi qui accanto.
   * ------------------------------------------------------------------ */
  var biglietto = document.getElementById('biglietto');

  function rigaBiglietto(chiave, testo) {
    if (!biglietto) { return; }
    var r = biglietto.querySelector('.riga[data-k="' + chiave + '"]');
    if (!r) { return; }
    r.querySelector('.riga__v').textContent = testo || '';
    r.setAttribute('data-pieno', testo ? 'true' : 'false');
  }

  function dataLunga(v) {
    if (!v) { return ''; }
    var d = new Date(v + 'T12:00:00');
    if (isNaN(d)) { return ''; }
    return d.toLocaleDateString(EN ? 'en-GB' : 'it-IT',
      { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function aggiornaBiglietto(totale, euro) {
    if (!biglietto) { return; }

    // `campoOrario` e `campoData` sono gia' quelli del resto del file: le
    // fasce orarie lanciano un `change` su campoOrario quando si scelgono
    // (riga 136), quindi da li' arriva anche l'aggiornamento del biglietto.
    var data = campoData ? campoData.value : '';
    var ora = campoOrario ? campoOrario.value : '';

    /* Il biglietto si compone VIA VIA, non tutto insieme alla fine.
     * Prima pretendeva data E orario per mostrare qualunque cosa: chi
     * sceglieva solo l'orario, o solo il numero di persone, vedeva un
     * riquadro muto e non capiva che stesse funzionando. Ora ogni riga
     * compare appena il suo dato c'e'. Il TOTALE resta legato a data e
     * orario, e non per pignoleria: senza la data non si sa se vale la
     * tariffa feriale o quella del weekend, e un totale che poi cambia
     * e' peggio di un totale che ancora non c'e'. */
    var avviato = !!(data || ora);
    var completo = !!(data && ora);

    biglietto.setAttribute('data-avviato', avviato ? 'true' : 'false');

    var quando = '';
    if (data && ora)      { quando = dataLunga(data) + ' · ' + ora; }
    else if (data)        { quando = dataLunga(data); }
    else if (ora)         { quando = ora; }
    rigaBiglietto('quando', quando);

    if (avviato) {
      var p = adulti + ' ' + (adulti === 1 ? T.adulto : T.adultiPl);
      if (bambini) { p += ' · ' + bambini + ' ' + (bambini === 1 ? T.bambino : T.bambiniPl); }
      rigaBiglietto('persone', p);
    } else {
      rigaBiglietto('persone', '');
    }

    var etichettaFormula = '';
    if (campoFormula && campoFormula.selectedIndex >= 0) {
      // La prima parte dell'etichetta, prima del primo separatore: basta
      // "Cena" invece di "Cena · 22,90 € (da lunedi a venerdi)".
      etichettaFormula = campoFormula.options[campoFormula.selectedIndex]
        .textContent.split('·')[0].trim();
    }
    rigaBiglietto('formula', completo ? etichettaFormula : '');

    var nome = form.elements.namedItem('nome');
    var cognome = form.elements.namedItem('cognome');
    var chi = ((nome ? nome.value : '') + ' ' + (cognome ? cognome.value : '')).trim();
    rigaBiglietto('nome', chi);

    var box = document.getElementById('biglietto-totale');
    if (box) { box.textContent = completo ? euro(totale) : '—'; }

    var stato = document.getElementById('biglietto-stato');
    if (stato) {
      stato.textContent = completo
        ? (EN ? 'to be confirmed' : 'da confermare')
        : (EN ? 'your table' : 'il vostro tavolo');
    }
  }

  if (biglietto) {
    // Il nome e il cognome non passano da aggiornaTotale: li ascoltiamo qui.
    form.addEventListener('input', function (e) {
      if (e.target && (e.target.name === 'nome' || e.target.name === 'cognome')) {
        aggiornaTotale();
      }
    });
    campoOrario.addEventListener('change', aggiornaTotale);
  }

  if (campoFormula) {
    campoFormula.addEventListener('change', aggiornaTotale);
  }
  // la formula si aggiorna da sola anche cambiando la data
  var campoData = form.elements.namedItem('data');
  if (campoData) {
    campoData.addEventListener('change', function () {
      // Il ridisegno rifà i prezzi in testa ai due turni: cambiando da un
      // feriale a un sabato passano da 14,90/22,90 a 18,90/24,90, e si deve
      // vedere prima di scegliere l'orario, non dopo.
      if (ridisegnaFasce) { ridisegnaFasce(); }
      window.setTimeout(aggiornaTotale, 0);
    });
  }

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
