/**
 * X-Sapori Savona — gestione del modulo di prenotazione.
 *
 * Nessuna dipendenza: niente jQuery, niente polyfill. Tutto quello che
 * serve (fetch, AbortController, Intl, closure) esiste in ogni browser
 * dal 2018 in poi.
 *
 * IMPORTANTE: questa validazione DUPLICA quella del server, non la
 * sostituisce. Serve a evitare al cliente una richiesta inutile, non a
 * proteggere il database: qualsiasi regola scritta qui si aggira dalla
 * console in cinque secondi. L'unica fonte di verità è api/booking.php.
 * Se cambiate una regola, modificate ENTRAMBI i file.
 */

(function () {
  'use strict';

  // ===================================================================
  //  Costanti
  // ===================================================================

  // L'indirizzo dell'API si legge dall'attributo action del modulo: così
  // la stessa logica funziona sia da /prenota.html sia da /en/book.html,
  // che ha bisogno di ../api/booking.php.

  // Il telefono sta in un punto solo: compare nei messaggi di errore di
  // rete, di gruppo troppo numeroso e di limite richieste superato.
  var PHONE_TEXT = '019 221 3138';
  var PHONE_HREF = 'tel:+390192213138';

  // Specchio di 'hours' in config.php. 1 = lunedì ... 7 = domenica.
  // Array vuoto = chiuso.
  var HOURS = {
    1: [['12:00', '15:00'], ['19:00', '23:00']],
    2: [['12:00', '15:00'], ['19:00', '23:00']],
    3: [['12:00', '15:00'], ['19:00', '23:00']],
    4: [['12:00', '15:00'], ['19:00', '23:00']],
    5: [['12:00', '15:00'], ['19:00', '23:00']],
    6: [['12:00', '15:00'], ['19:00', '23:00']],
    7: [['12:00', '15:00'], ['19:00', '23:00']]
  };

  var CLOSED_DATES = [];          // chiusure straordinarie, formato YYYY-MM-DD

  // Specchio di 'holidays' in config.php. Nei giorni festivi vale la
  // tariffa del weekend anche se cadono in settimana. Formato MM-DD.
  var HOLIDAYS = [
    '01-01',  // Capodanno
    '01-06',  // Epifania
    '03-18',  // Nostra Signora di Misericordia, patrona di Savona
    '04-25',  // Festa della Liberazione
    '05-01',  // Festa del Lavoro
    '06-02',  // Festa della Repubblica
    '08-15',  // Ferragosto
    '11-01',  // Ognissanti
    '12-08',  // Immacolata
    '12-25',  // Natale
    '12-26'   // Santo Stefano
  ];

  var HOLIDAYS_EXTRA = [];        // festivi straordinari, formato YYYY-MM-DD
  var EASTER_HOLIDAYS = true;     // Pasqua e Lunedì dell'Angelo
  var LAST_SEATING_BEFORE_CLOSE = 45;  // minuti prima della chiusura
  var MIN_MINUTES_AHEAD = 30;     // per oggi: non prima di mezz'ora da adesso
  var MAX_MONTHS_AHEAD = 6;
  var MIN_GUESTS = 1;
  var MAX_GUESTS = 40;

  var REQUEST_TIMEOUT_MS = 15000; // oltre non ha senso aspettare

  // Lingua della pagina. I testi rivolti al cliente esistono in due
  // versioni: la logica di validazione e identica, cambiano solo le frasi.
  var EN = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0;

  var MSG_EN = {
    dateEmpty:    'Please choose a date.',
    dateInvalid:  'This date is not valid.',
    datePast:     'You cannot book a date in the past.',
    dateFar:      'We take bookings up to six months ahead. For later dates, please call us.',
    dateClosed:   'We are closed that day. Please pick another date.',
    dayClosed:    'We are not open that day. Please pick another date.',
    timeEmpty:    'Please enter your arrival time.',
    timeInvalid:  'This time is not valid.',
    guestsEmpty:  'Please tell us how many of you there are.',
    nameEmpty:    'Please enter your first name.',
    nameLength:   'The first name must be between 2 and 60 characters.',
    surnameEmpty: 'Please enter your last name.',
    surnameLength:'The last name must be between 2 and 60 characters.',
    phoneEmpty:   'Please leave a phone number: we call back to confirm.',
    phoneInvalid: 'This phone number does not look right. Example: 019 221 3138.',
    emailInvalid: 'This email address does not look right.',
    privacy:      'To send the request you need to accept the privacy terms.',
    formInvalid:  'Please check the fields marked below.',
    sending:      'Sending…',
    submitLabel:  'Send request',
    serverError:  'Something went wrong on our side. Please try again in a few minutes.',
    networkError: 'We could not send the request: check your connection and try again.'
  };

  // I testi italiani restano la versione di riferimento del sito.
  var MSG = {
    dateEmpty:    'Indicate la data della prenotazione.',
    dateInvalid:  'La data non è valida.',
    datePast:     'Non è possibile prenotare per una data passata.',
    dateFar:      'Accettiamo prenotazioni fino a sei mesi in anticipo. Per date più lontane chiamateci.',
    dateClosed:   'Quel giorno il ristorante è chiuso. Scegliete un\'altra data.',
    dayClosed:    'Quel giorno il ristorante non è aperto. Scegliete un\'altra data.',
    timeEmpty:    'Indicate l\'orario di arrivo.',
    timeInvalid:  'L\'orario non è valido.',
    guestsEmpty:  'Indicate quante persone siete.',
    nameEmpty:    'Indicate il vostro nome.',
    nameLength:   'Il nome deve essere lungo tra 2 e 60 caratteri.',
    surnameEmpty: 'Indicate il vostro cognome.',
    surnameLength:'Il cognome deve essere lungo tra 2 e 60 caratteri.',
    phoneEmpty:   'Indicate un numero di telefono: vi richiamiamo per confermare.',
    phoneInvalid: 'Il numero di telefono non sembra corretto. Esempio: 019 221 3138.',
    emailInvalid: 'L\'indirizzo email non sembra corretto.',
    privacy:      'Per inviare la richiesta è necessario acconsentire al trattamento dei dati.',
    formInvalid:  'Controllate i campi segnalati qui sotto.',
    sending:      'Invio in corso…',
    submitLabel:  'Invia la richiesta',
    serverError:  'Si è verificato un problema tecnico. Riprovate tra qualche minuto.',
    networkError: 'Non siamo riusciti a inviare la richiesta: controllate la connessione e riprovate.'
  };

  if (EN) { MSG = MSG_EN; }

  // ===================================================================
  //  Riferimenti agli elementi
  // ===================================================================

  var form = document.getElementById('booking-form');
  if (!form) { return; }   // pagina senza modulo: usciamo in silenzio

  var ENDPOINT = form.getAttribute('action') || 'api/booking.php';

  var submitBtn = document.getElementById('booking-submit');
  var formMsg   = document.getElementById('form-msg');

  /** Campi per cui mostriamo un errore. La chiave è il name lato server. */
  var FIELDS = ['data', 'orario', 'persone', 'formula', 'occasione',
                'nome', 'cognome', 'telefono', 'email', 'privacy'];

  function input(name) {
    return form.elements.namedItem(name);
  }

  // ===================================================================
  //  Piccole utilità
  // ===================================================================

  /** "HH:MM" -> minuti da mezzanotte, oppure null. */
  function toMinutes(hhmm) {
    var m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || '');
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }

  /** Date -> "YYYY-MM-DD" in ora locale.
   *  toISOString() non va bene: converte in UTC e in Italia, d'estate,
   *  sposta la data al giorno prima per gli orari fino alle 02:00. */
  function ymd(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  /** Numero ISO del giorno della settimana: 1 = lunedì ... 7 = domenica. */
  function isoWeekday(d) {
    return d.getDay() === 0 ? 7 : d.getDay();
  }

  /** Data della Pasqua cattolica. Algoritmo Meeus/Jones/Butcher,
   *  lo stesso di easter_date_for() in api/booking.php. */
  function easterOf(year) {
    var a = year % 19,
        b = Math.floor(year / 100),
        c = year % 100,
        d = Math.floor(b / 4),
        e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4),
        k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31),
        day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  /** Se il giorno è festivo. Specchio di is_festivo() sul server. */
  function isFestivo(d) {
    var md = ymd(d).slice(5);

    if (HOLIDAYS.indexOf(md) !== -1) { return true; }
    if (HOLIDAYS_EXTRA.indexOf(ymd(d)) !== -1) { return true; }

    if (EASTER_HOLIDAYS) {
      var e = easterOf(d.getFullYear());
      if (ymd(d) === ymd(e)) { return true; }
      var pasquetta = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
      if (ymd(d) === ymd(pasquetta)) { return true; }
    }
    return false;
  }

  /** Quale servizio in base all'ora: 'pranzo' | 'cena' | null (fuori orario). */
  function serviceFor(date, minutes) {
    var windows = HOURS[isoWeekday(date)] || [];

    for (var i = 0; i < windows.length; i++) {
      var open = toMinutes(windows[i][0]);
      var close = toMinutes(windows[i][1]);
      if (minutes >= open && minutes <= close - LAST_SEATING_BEFORE_CLOSE) {
        return i === 0 ? 'pranzo' : 'cena';
      }
    }
    return null;
  }

  /** L'unica formula corretta per questa data e questo orario. */
  function expectedFormula(date, minutes) {
    var service = serviceFor(date, minutes);
    if (!service) { return null; }

    var weekend = isoWeekday(date) >= 6 || isFestivo(date);
    return service + '_' + (weekend ? 'weekend' : 'feriale');
  }

  /** "YYYY-MM-DD" -> Date nel fuso locale, null se il valore non è valido.
   *  new Date("2026-02-31") restituisce il 3 marzo senza avvisare: per
   *  questo ricontrolliamo il risultato a ritroso. */
  function parseDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str || '')) { return null; }
    var p = str.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return ymd(d) === str ? d : null;
  }

  // ===================================================================
  //  Errori sui campi
  // ===================================================================

  /**
   * Trova o crea lo <span class="field-error"> del campo.
   * Lo creiamo da JavaScript e non nel markup: così l'HTML non porta
   * dieci elementi vuoti e gli id non possono sfasarsi da aria-describedby.
   */
  function errorSlot(el) {
    var wrap = el.closest('.field') || el.closest('.checkbox');
    if (!wrap) { return null; }

    var slot = wrap.querySelector('.field-error');
    if (!slot) {
      slot = document.createElement('span');
      slot.className = 'field-error';
      slot.id = 'err-' + el.name;
      wrap.appendChild(slot);
    }
    return slot;
  }

  function setFieldError(name, message) {
    var el = input(name);
    if (!el) { return; }

    var slot = errorSlot(el);
    if (!slot) { return; }

    slot.textContent = message;
    el.setAttribute('aria-invalid', 'true');

    // Colleghiamo il campo al testo dell'errore conservando l'eventuale
    // aria-describedby già presente, se il campo ha un .hint.
    var described = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (described.indexOf(slot.id) === -1) {
      described.push(slot.id);
      el.setAttribute('aria-describedby', described.join(' '));
    }

    var wrap = el.closest('.field');
    if (wrap) { wrap.classList.add('field--invalid'); }
    var check = el.closest('.checkbox');
    if (check) { check.classList.add('checkbox--invalid'); }
  }

  function clearFieldError(name) {
    var el = input(name);
    if (!el) { return; }

    el.removeAttribute('aria-invalid');

    var wrap = el.closest('.field');
    if (wrap) { wrap.classList.remove('field--invalid'); }
    var check = el.closest('.checkbox');
    if (check) { check.classList.remove('checkbox--invalid'); }

    var slot = (wrap || check) && (wrap || check).querySelector('.field-error');
    if (slot) { slot.textContent = ''; }
  }

  function clearAllErrors() {
    FIELDS.forEach(clearFieldError);
    hideFormMessage();
  }

  // ===================================================================
  //  Messaggio generale
  // ===================================================================

  function showFormMessage(kind, html) {
    if (!formMsg) { return; }
    formMsg.className = 'form-msg form-msg--' + kind;
    formMsg.innerHTML = html;
    formMsg.hidden = false;
  }

  function hideFormMessage() {
    if (!formMsg) { return; }
    formMsg.hidden = true;
    formMsg.innerHTML = '';
    formMsg.className = 'form-msg';
  }

  /** Il link «chiamateci» si compone in un punto solo. */
  function callUsHtml() {
    return 'Potete anche chiamarci allo <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.';
  }

  /** Escape: tutto ciò che arriva dal server finisce dentro innerHTML. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
  }

  // ===================================================================
  //  Validazione
  // ===================================================================

  /**
   * Restituisce un array [{field, message}]. Array vuoto = tutto a posto.
   * L'ordine dei controlli segue l'ordine dei campi nel modulo, così che
   * il «primo errore» su cui va il focus sia il più in alto sullo schermo.
   */
  function validate(values) {
    var errors = [];
    var add = function (field, message) { errors.push({ field: field, message: message }); };

    // ---------- data ----------
    var date = null;
    if (!values.data) {
      add('data', MSG.dateEmpty);
    } else {
      date = parseDate(values.data);
      if (!date) {
        add('data', MSG.dateInvalid);
      } else {
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var limit = new Date(today);
        limit.setMonth(limit.getMonth() + MAX_MONTHS_AHEAD);

        if (date < today) {
          add('data', MSG.datePast);
        } else if (date > limit) {
          add('data', MSG.dateFar);
        } else if (CLOSED_DATES.indexOf(values.data) !== -1) {
          add('data', MSG.dateClosed);
        }
      }
    }

    // ---------- orario ----------
    var minutes = null;
    if (!values.orario) {
      add('orario', MSG.timeEmpty);
    } else {
      minutes = toMinutes(values.orario);
      if (minutes === null) { add('orario', MSG.timeInvalid); }
    }

    // ---------- data + orario: calendario di apertura ----------
    // Solo se entrambe sono corrette per conto loro, altrimenti il cliente
    // riceve due errori per lo stesso problema.
    if (date && minutes !== null && !errors.length) {
      var windows = HOURS[isoWeekday(date)] || [];

      if (!windows.length) {
        add('data', MSG.dayClosed);
      } else {
        var fits = false;
        var human = [];

        for (var i = 0; i < windows.length; i++) {
          var open = toMinutes(windows[i][0]);
          var close = toMinutes(windows[i][1]);
          human.push(windows[i][0] + '–' + windows[i][1]);

          if (minutes >= open && minutes <= close - LAST_SEATING_BEFORE_CLOSE) {
            fits = true;
          }
        }

        if (!fits) {
          add('orario', 'A quell\'ora la cucina è chiusa. Orari di servizio: ' +
              human.join(' e ') + '. L\'ultimo ingresso è ' +
              LAST_SEATING_BEFORE_CLOSE + ' minuti prima della chiusura.');
        } else {
          // Prenotazione per oggi, ma l'orario è passato o troppo vicino.
          var slot = new Date(date);
          slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

          var earliest = new Date();
          earliest.setMinutes(earliest.getMinutes() + MIN_MINUTES_AHEAD);

          if (slot < earliest) {
            add('orario', 'Per oggi accettiamo prenotazioni con almeno ' +
                MIN_MINUTES_AHEAD + ' minuti di anticipo. Per un tavolo subito, chiamateci allo ' +
                PHONE_TEXT + '.');
          }
        }
      }
    }

    // ---------- numero di persone ----------
    if (!values.persone) {
      add('persone', MSG.guestsEmpty);
    } else {
      var n = Number(values.persone);
      if (!Number.isInteger(n) || n < MIN_GUESTS || n > MAX_GUESTS) {
        add('persone', 'Il numero di persone deve essere compreso tra ' + MIN_GUESTS +
            ' e ' + MAX_GUESTS + '. Per gruppi più numerosi chiamateci allo ' + PHONE_TEXT + '.');
      }
    }

    // ---------- nome e cognome ----------
    // Lunghezza in caratteri: .length in JavaScript conta unità UTF-16,
    // per l'alfabeto latino e gli accenti italiani è più che sufficiente.
    if (!values.nome) {
      add('nome', MSG.nameEmpty);
    } else if (values.nome.length < 2 || values.nome.length > 60) {
      add('nome', MSG.nameLength);
    }

    if (!values.cognome) {
      add('cognome', MSG.surnameEmpty);
    } else if (values.cognome.length < 2 || values.cognome.length > 60) {
      add('cognome', MSG.surnameLength);
    }

    // ---------- telefono ----------
    if (!values.telefono) {
      add('telefono', MSG.phoneEmpty);
    } else {
      var digits = values.telefono.replace(/\D+/g, '').replace(/^00/, '');
      if (digits.length < 6 || digits.length > 15) {
        add('telefono', MSG.phoneInvalid);
      }
    }

    // ---------- email (facoltativa) ----------
    // Controllo volutamente permissivo: le espressioni regolari severe
    // scartano indirizzi validi più spesso di quanto trovino errori di
    // battitura. La verifica vera la fa filter_var sul server.
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
      add('email', MSG.emailInvalid);
    }

    // ---------- la formula deve corrispondere a data e orario ----------
    // Duplica il controllo del server. In pratica non ci si arriva quasi
    // mai: syncFormula(), più sotto, aggiorna la tendina da sola appena il
    // cliente cambia data od orario. Il controllo serve nel caso il valore
    // sia stato inserito scavalcando l'interfaccia.
    if (date && minutes !== null) {
      var expected = expectedFormula(date, minutes);

      if (expected && values.formula && values.formula !== expected) {
        var el = input('formula');
        var label = '';
        for (var j = 0; el && j < el.options.length; j++) {
          if (el.options[j].value === expected) { label = el.options[j].text; }
        }

        var why;
        if (isFestivo(date)) {
          why = 'Quel giorno è festivo, quindi si applica la tariffa festiva.';
        } else if (isoWeekday(date) >= 6) {
          why = 'Quel giorno cade nel fine settimana.';
        } else {
          why = 'Quel giorno è feriale, quindi si applica la tariffa feriale.';
        }

        add('formula', why + ' La formula corretta è «' + label + '».');
      }
    }

    // ---------- consenso privacy ----------
    if (!values.privacy) {
      add('privacy', MSG.privacy);
    }

    return errors;
  }

  // ===================================================================
  //  Formula impostata in automatico
  // ===================================================================

  /**
   * Seleziona nella tendina la formula corrispondente a data e orario.
   *
   * La tariffa si ricava senza ambiguità da data e orario, quindi non ha
   * senso lasciar sbagliare il cliente: scelto martedì alle 20:30, nella
   * tendina compare da sola «Cena feriale». La scelta non viene bloccata:
   * la tendina resta normale, solo con il valore giusto già impostato.
   */
  function syncFormula() {
    var el = input('formula');
    var dateEl = input('data');
    var timeEl = input('orario');
    if (!el || !dateEl || !timeEl) { return; }

    var date = parseDate(dateEl.value);
    var minutes = toMinutes((timeEl.value || '').slice(0, 5));
    if (!date || minutes === null) { return; }

    var expected = expectedFormula(date, minutes);
    if (expected && el.value !== expected) {
      el.value = expected;
      clearFieldError('formula');
    }
  }

  // ===================================================================
  //  Raccolta dei valori
  // ===================================================================

  function collect() {
    var val = function (name) {
      var el = input(name);
      return el ? el.value.trim() : '';
    };
    var privacyEl = input('privacy');

    return {
      data:      val('data'),
      orario:    val('orario').slice(0, 5),
      persone:   val('persone'),
      formula:   val('formula'),
      occasione: val('occasione'),
      nome:      val('nome').replace(/\s+/g, ' '),
      cognome:   val('cognome').replace(/\s+/g, ' '),
      telefono:  val('telefono'),
      email:     val('email'),
      note:      val('note').slice(0, 1000),
      privacy:   !!(privacyEl && privacyEl.checked),
      // L'honeypot si invia com'è: per una persona resta vuoto, un bot lo
      // compila e riceve dal server un rifiuto silenzioso.
      xs_riscontro: val('xs_riscontro')
    };
  }

  // ===================================================================
  //  Stato del pulsante
  // ===================================================================

  function setLoading(on) {
    if (!submitBtn) { return; }

    submitBtn.disabled = on;
    if (on) {
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = '<span class="btn__spinner" aria-hidden="true"></span>' + MSG.sending;
    } else {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = MSG.submitLabel;
    }
  }

  // ===================================================================
  //  Visualizzazione degli errori
  // ===================================================================

  function showErrors(errors) {
    var firstNamed = null;
    var general = [];

    errors.forEach(function (e) {
      if (e.field && input(e.field)) {
        setFieldError(e.field, e.message);
        if (!firstNamed) { firstNamed = e.field; }
      } else {
        // Errore senza campo associato (429, 403, 500): va nel blocco generale.
        general.push(e.message);
      }
    });

    if (general.length) {
      showFormMessage('error', general.map(escapeHtml).join('<br>') + '<br>' + callUsHtml());
    } else if (firstNamed) {
      showFormMessage('error', escapeHtml(MSG.formInvalid));
    }

    // Focus sul primo campo problematico: senza, da telefono il cliente
    // vede solo il pulsante e non capisce cosa sia andato storto.
    var target = firstNamed ? input(firstNamed) : formMsg;
    if (target) {
      // Il blocco messaggio non è focalizzabile per natura: lo rendiamo
      // tale, altrimenti il focus resta sul pulsante e l'errore passa
      // inosservato.
      if (target === formMsg) { formMsg.setAttribute('tabindex', '-1'); }
      if (typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ------------------------------------------------------------------
   *  Conferma
   *  Se la pagina contiene il riquadro #esito mostriamo una vera
   *  schermata di conferma con il riepilogo e il file .ics. Se non c'è
   *  (o se qualcosa va storto) restiamo sul messaggio di testo: il
   *  percorso vecchio non viene mai lasciato senza rete di sicurezza.
   * ------------------------------------------------------------------ */

  var ETICHETTE_FORMULA = EN ? {
    pranzo_feriale: 'Lunch / €14.90 (Mon–Fri)',
    cena_feriale:   'Dinner / €22.90 (Mon–Fri)',
    pranzo_weekend: 'Lunch / €18.90 (weekends and holidays)',
    cena_weekend:   'Dinner / €24.90 (weekends and holidays)'
  } : {
    pranzo_feriale: 'Pranzo / 14,90 € (lun–ven)',
    cena_feriale:   'Cena / 22,90 € (lun–ven)',
    pranzo_weekend: 'Pranzo / 18,90 € (weekend e festivi)',
    cena_weekend:   'Cena / 24,90 € (weekend e festivi)'
  };

  var ETICHETTE_RIEPILOGO = EN
    ? ['When', 'Guests', 'Set menu', 'Name', 'Phone']
    : ['Quando', 'Persone', 'Formula', 'A nome di', 'Telefono'];

  /** "2026-09-15" -> "martedì 15 settembre 2026" */
  function dataEstesa(iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!p) { return iso || ''; }
    var d = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]));
    try {
      return d.toLocaleDateString(EN ? 'en-GB' : 'it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return p[3] + '/' + p[2] + '/' + p[1];
    }
  }

  /** File .ics con la sola data e ora richieste: due ore di durata. */
  function costruisciIcs(values) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(values.data || '');
    var t = /^(\d{2}):(\d{2})$/.exec(values.orario || '');
    if (!p || !t) { return null; }

    var inizio = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]), Number(t[1]), Number(t[2]));
    var fine = new Date(inizio.getTime() + 2 * 60 * 60 * 1000);

    // Orario locale senza fuso: l'evento vale nell'ora del ristorante.
    var fmt = function (d) {
      var due = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + due(d.getMonth() + 1) + due(d.getDate()) +
             'T' + due(d.getHours()) + due(d.getMinutes()) + '00';
    };

    var righe = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//X-Sapori//Prenotazione//IT',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@x-sapori',
      'DTSTAMP:' + fmt(new Date()) + 'Z',
      'DTSTART:' + fmt(inizio),
      'DTEND:' + fmt(fine),
      'SUMMARY:' + (EN ? 'Dinner at X-Sapori (' + values.persone + ' guests)' : 'Cena da X-Sapori (' + values.persone + ' persone)'),
      'LOCATION:Via Luigi Pirandello 2r\\, 17100 Savona SV',
      'DESCRIPTION:' + (EN ? 'Booking request sent. Confirmation comes by phone on ' : 'Richiesta di prenotazione inviata. La conferma arriva per telefono allo ') + PHONE_TEXT + '.',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(righe.join('\r\n'));
  }

  function showSuccess(values) {
    // L'ordine conta: reset ripulisce gli errori tramite il suo handler,
    // solo dopo disegniamo la conferma.
    form.reset();

    var esito = document.getElementById('esito');
    var riepilogo = document.getElementById('esito-riepilogo');

    if (esito && riepilogo && values) {
      var righe = [
        [ETICHETTE_RIEPILOGO[0], dataEstesa(values.data) + (EN ? ' at ' : ' alle ') + (values.orario || '')],
        [ETICHETTE_RIEPILOGO[1], String(values.persone || '')],
        [ETICHETTE_RIEPILOGO[2], ETICHETTE_FORMULA[values.formula] || values.formula || ''],
        [ETICHETTE_RIEPILOGO[3], ((values.nome || '') + ' ' + (values.cognome || '')).trim()],
        [ETICHETTE_RIEPILOGO[4], values.telefono || '']
      ];

      riepilogo.innerHTML = '';
      righe.forEach(function (r) {
        if (!r[1]) { return; }
        var div = document.createElement('div');
        var etichetta = document.createElement('span');
        var valore = document.createElement('strong');
        etichetta.textContent = r[0];
        valore.textContent = r[1];
        div.appendChild(etichetta);
        div.appendChild(valore);
        riepilogo.appendChild(div);
      });

      var ics = document.getElementById('esito-ics');
      var href = costruisciIcs(values);
      if (ics) {
        if (href) { ics.href = href; ics.hidden = false; }
        else { ics.hidden = true; }
      }

      form.hidden = true;
      esito.dataset.visible = 'true';
      esito.focus({ preventScroll: true });
      esito.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Rete di sicurezza: pagina senza riquadro di conferma.
    showFormMessage('ok',
      '<strong>Richiesta inviata</strong>' +
      'Grazie! Abbiamo ricevuto la vostra richiesta di prenotazione. ' +
      'Vi richiamiamo per confermare entro poche ore, negli orari di apertura. ' +
      'Se avete fretta, chiamateci allo <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.'
    );

    if (formMsg) {
      // tabindex -1 e focus: screen reader e tastiera arrivano diretti
      // sulla conferma invece di restare sul pulsante.
      formMsg.setAttribute('tabindex', '-1');
      formMsg.focus({ preventScroll: true });
      formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ===================================================================
  //  Invio
  // ===================================================================

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (submitBtn && submitBtn.disabled) { return; }   // protezione dal doppio clic

    clearAllErrors();

    var values = collect();
    var errors = validate(values);

    if (errors.length) {
      showErrors(errors);
      return;
    }

    send(values);
  });

  function send(values) {
    setLoading(true);

    // AbortController: senza timeout una richiesta bloccata lascerebbe il
    // pulsante disabilitato per sempre.
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) { controller.abort(); }
    }, REQUEST_TIMEOUT_MS);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(values),
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        // Leggiamo il corpo in ogni caso: messaggi utili arrivano sia con
        // 422 sia con 429. Se al posto del JSON arriva la pagina di errore
        // dell'hosting, json() solleva un'eccezione: la prendiamo più sotto.
        return response.json()
          .catch(function () { return null; })
          .then(function (data) {
            return { status: response.status, data: data };
          });
      })
      .then(function (result) {
        clearTimeout(timer);
        setLoading(false);

        if (result.data && result.data.ok === true) {
          showSuccess(values);
          return;
        }

        if (result.data && Array.isArray(result.data.errors) && result.data.errors.length) {
          showErrors(result.data.errors);
          return;
        }

        // Il server ha risposto ma non nel formato atteso: 500 senza JSON,
        // pagina di cortesia dell'hosting, PHP interrotto da un errore fatale.
        showFormMessage('error', escapeHtml(MSG.serverError) + '<br>' + callUsHtml());
      })
      .catch(function (error) {
        clearTimeout(timer);
        setLoading(false);

        // Qui si arriva per rete caduta, DNS, CORS o timeout. Distinguerli
        // per il cliente non serve: quel che conta è dargli il telefono.
        var text = (error && error.name === 'AbortError')
          ? 'La richiesta ha impiegato troppo tempo.'
          : MSG.networkError;

        showFormMessage('error', escapeHtml(text) + '<br>' + callUsHtml());

        if (formMsg) { formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
  }

  // ===================================================================
  //  Reazione alle modifiche dei campi
  // ===================================================================

  // L'errore sparisce appena il cliente inizia a correggere il campo.
  // Tenere il bordo rosso mentre scrive è solo fastidioso.
  FIELDS.forEach(function (name) {
    var el = input(name);
    if (!el) { return; }

    var eventName = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' || el.type === 'time')
      ? 'change'
      : 'input';

    el.addEventListener(eventName, function () { clearFieldError(name); });
  });

  // Data e orario determinano la tariffa: ricalcoliamo la formula quando cambiano.
  ['data', 'orario'].forEach(function (name) {
    var el = input(name);
    if (el) { el.addEventListener('change', syncFormula); }
  });

  // Questo handler è sincrono DI PROPOSITO. La tentazione di rimandarlo a
  // un setTimeout è forte, ma showSuccess() chiama form.reset() da sé: una
  // pulizia differita cancellerebbe la conferma un millisecondo dopo averla
  // mostrata. Qui non serve leggere i valori dei campi, e reset non tocca
  // min e max della data: non c'è niente da aspettare.
  form.addEventListener('reset', function () {
    clearAllErrors();
  });

  // ===================================================================
  //  Inizializzazione
  // ===================================================================

  /** Limiti del calendario: da oggi a sei mesi avanti.
   *  È un suggerimento, non una protezione: il controllo lo fa il server. */
  function applyDateBounds() {
    var el = input('data');
    if (!el) { return; }

    var today = new Date();
    var limit = new Date();
    limit.setMonth(limit.getMonth() + MAX_MONTHS_AHEAD);

    el.min = ymd(today);
    el.max = ymd(limit);
  }

  applyDateBounds();
  setLoading(false);
})();
