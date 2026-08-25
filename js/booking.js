/**
 * X-Sapori Savona — обработка формы бронирования столика.
 *
 * Без зависимостей: ни jQuery, ни полифилов. Всё используемое
 * (fetch, AbortController, Intl, замыкания в классах) есть во всех
 * браузерах с 2018 года.
 *
 * ВАЖНО: валидация здесь ДУБЛИРУЕТ серверную, но не заменяет её.
 * Задача клиентской проверки — избавить гостя от лишнего запроса,
 * а не защитить базу. Любые правила ниже обходятся через консоль
 * за пять секунд, поэтому единственный источник правды —
 * api/booking.php. При изменении правил правьте ОБА файла.
 */

(function () {
  'use strict';

  // ===================================================================
  //  Константы
  // ===================================================================

  var ENDPOINT = 'api/booking.php';

  // Телефон в одном месте: используется в сообщениях об ошибке сети,
  // о слишком большой компании и о превышении лимита заявок.
  var PHONE_TEXT = '019 221 3138';
  var PHONE_HREF = 'tel:+390192213138';

  // Зеркало 'hours' из config.php. 1 = lunedì ... 7 = domenica.
  // Пустой массив = закрыто.
  var HOURS = {
    1: [['12:00', '15:00'], ['19:00', '23:00']],
    2: [['12:00', '15:00'], ['19:00', '23:00']],
    3: [['12:00', '15:00'], ['19:00', '23:00']],
    4: [['12:00', '15:00'], ['19:00', '23:00']],
    5: [['12:00', '15:00'], ['19:00', '23:00']],
    6: [['12:00', '15:00'], ['19:00', '23:00']],
    7: [['12:00', '15:00'], ['19:00', '23:00']]
  };

  var CLOSED_DATES = [];          // разовые закрытия, формат YYYY-MM-DD

  // Зеркало 'holidays' из config.php. В праздник действует тариф
  // выходного дня, даже если это будни. Формат MM-DD.
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

  var HOLIDAYS_EXTRA = [];        // разовые праздники, формат YYYY-MM-DD
  var EASTER_HOLIDAYS = true;     // Pasqua e Lunedì dell'Angelo
  var LAST_SEATING_BEFORE_CLOSE = 45;  // минут до закрытия
  var MIN_MINUTES_AHEAD = 30;     // на сегодня — не раньше чем через полчаса
  var MAX_MONTHS_AHEAD = 6;
  var MIN_GUESTS = 1;
  var MAX_GUESTS = 40;

  var REQUEST_TIMEOUT_MS = 15000; // дольше ждать бессмысленно

  // Тексты для пользователя — на итальянском, как и весь сайт.
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

  // ===================================================================
  //  Ссылки на элементы
  // ===================================================================

  var form = document.getElementById('booking-form');
  if (!form) { return; }   // страница без формы — выходим молча

  var submitBtn = document.getElementById('booking-submit');
  var formMsg   = document.getElementById('form-msg');

  /** Поля, для которых показываем ошибки. Ключ = name на сервере. */
  var FIELDS = ['data', 'orario', 'persone', 'formula', 'occasione',
                'nome', 'cognome', 'telefono', 'email', 'privacy'];

  function input(name) {
    return form.elements.namedItem(name);
  }

  // ===================================================================
  //  Мелкие утилиты
  // ===================================================================

  /** "HH:MM" -> минуты от полуночи, либо null. */
  function toMinutes(hhmm) {
    var m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || '');
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }

  /** Date -> "YYYY-MM-DD" по локальному времени.
   *  toISOString() не годится: он переводит в UTC и в Италии
   *  летом сдвигает дату на день назад для времени до 02:00. */
  function ymd(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  /** ISO-номер дня недели: 1 = понедельник ... 7 = воскресенье. */
  function isoWeekday(d) {
    return d.getDay() === 0 ? 7 : d.getDay();
  }

  /** Дата католической Пасхи. Алгоритм Meeus/Jones/Butcher,
   *  тот же, что в easter_date_for() в api/booking.php. */
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

  /** Праздничный ли день. Зеркало is_festivo() на сервере. */
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

  /** Какая смена по времени: 'pranzo' | 'cena' | null (вне часов). */
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

  /** Единственно верная формула для этой даты и времени. */
  function expectedFormula(date, minutes) {
    var service = serviceFor(date, minutes);
    if (!service) { return null; }

    var weekend = isoWeekday(date) >= 6 || isFestivo(date);
    return service + '_' + (weekend ? 'weekend' : 'feriale');
  }

  /** "YYYY-MM-DD" -> Date в местном поясе, либо null при мусоре.
   *  new Date("2026-02-31") молча даёт 3 марта, поэтому сверяем обратно. */
  function parseDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str || '')) { return null; }
    var p = str.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return ymd(d) === str ? d : null;
  }

  // ===================================================================
  //  Ошибки у полей
  // ===================================================================

  /**
   * Находит или создаёт <span class="field-error"> для поля.
   * Создаём из JS, а не в разметке: так в HTML нет десятка пустых
   * элементов, и id гарантированно не разъедутся с aria-describedby.
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

    // Связываем поле с текстом ошибки, сохраняя уже существующий
    // aria-describedby, если у поля есть .hint.
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
  //  Общее сообщение
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

  /** Ссылка «позвоните нам» — собирается в одном месте. */
  function callUsHtml() {
    return 'Potete anche chiamarci allo <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.';
  }

  /** Экранирование: всё, что приходит с сервера, попадает в innerHTML. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
  }

  // ===================================================================
  //  Валидация
  // ===================================================================

  /**
   * Возвращает массив [{field, message}]. Пустой массив = всё в порядке.
   * Порядок проверок совпадает с порядком полей в форме, чтобы
   * «первая ошибка» при переносе фокуса была самой верхней на экране.
   */
  function validate(values) {
    var errors = [];
    var add = function (field, message) { errors.push({ field: field, message: message }); };

    // ---------- дата ----------
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

    // ---------- время ----------
    var minutes = null;
    if (!values.orario) {
      add('orario', MSG.timeEmpty);
    } else {
      minutes = toMinutes(values.orario);
      if (minutes === null) { add('orario', MSG.timeInvalid); }
    }

    // ---------- дата + время: расписание ----------
    // Только если обе части корректны сами по себе, иначе гость
    // получит две ошибки об одном и том же.
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
          // Бронь на сегодня, но время уже прошло или слишком близко.
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

    // ---------- гости ----------
    if (!values.persone) {
      add('persone', MSG.guestsEmpty);
    } else {
      var n = Number(values.persone);
      if (!Number.isInteger(n) || n < MIN_GUESTS || n > MAX_GUESTS) {
        add('persone', 'Il numero di persone deve essere compreso tra ' + MIN_GUESTS +
            ' e ' + MAX_GUESTS + '. Per gruppi più numerosi chiamateci allo ' + PHONE_TEXT + '.');
      }
    }

    // ---------- имя и фамилия ----------
    // Длина в символах: строковый .length в JS считает единицы UTF-16,
    // для латиницы и итальянских диакритиков этого достаточно.
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

    // ---------- телефон ----------
    if (!values.telefono) {
      add('telefono', MSG.phoneEmpty);
    } else {
      var digits = values.telefono.replace(/\D+/g, '').replace(/^00/, '');
      if (digits.length < 6 || digits.length > 15) {
        add('telefono', MSG.phoneInvalid);
      }
    }

    // ---------- email (необязательный) ----------
    // Проверка нарочно мягкая. Строгие регулярки на email отсекают
    // живые адреса чаще, чем ловят опечатки; настоящую проверку
    // делает filter_var на сервере.
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
      add('email', MSG.emailInvalid);
    }

    // ---------- формула должна соответствовать дате и времени ----------
    // Дублирует серверную проверку. На практике сюда почти не попадают:
    // syncFormula() ниже переключает список сам, как только гость
    // меняет дату или время. Проверка нужна на случай, если значение
    // подставили в обход интерфейса.
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

    // ---------- согласие ----------
    if (!values.privacy) {
      add('privacy', MSG.privacy);
    }

    return errors;
  }

  // ===================================================================
  //  Автоподстановка формулы
  // ===================================================================

  /**
   * Выставляет в списке формулу, соответствующую дате и времени.
   *
   * Тариф однозначно выводится из даты и времени, поэтому давать
   * гостю ошибаться незачем: как только он выбрал вторник и 20:30,
   * в списке сама встаёт «Cena feriale». Выбор при этом не заблокирован —
   * список остаётся обычным, просто с правильным значением.
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
  //  Сбор значений
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
  //  Состояние кнопки
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
  //  Отображение ошибок
  // ===================================================================

  function showErrors(errors) {
    var firstNamed = null;
    var general = [];

    errors.forEach(function (e) {
      if (e.field && input(e.field)) {
        setFieldError(e.field, e.message);
        if (!firstNamed) { firstNamed = e.field; }
      } else {
        // Ошибка без поля (429, 403, 500) — в общий блок.
        general.push(e.message);
      }
    });

    if (general.length) {
      showFormMessage('error', general.map(escapeHtml).join('<br>') + '<br>' + callUsHtml());
    } else if (firstNamed) {
      showFormMessage('error', escapeHtml(MSG.formInvalid));
    }

    // Фокус на первое проблемное поле: без этого на мобильном
    // гость видит только кнопку и не понимает, что пошло не так.
    var target = firstNamed ? input(firstNamed) : formMsg;
    if (target) {
      // Блок сообщения по умолчанию не фокусируемый — делаем его таким,
      // иначе фокус останется на кнопке и ошибка пройдёт мимо внимания.
      if (target === formMsg) { formMsg.setAttribute('tabindex', '-1'); }
      if (typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showSuccess() {
    // Порядок важен: reset синхронно чистит ошибки через свой обработчик,
    // и только после этого рисуем подтверждение.
    form.reset();
    showFormMessage('ok',
      '<strong>Richiesta inviata</strong>' +
      'Grazie! Abbiamo ricevuto la vostra richiesta di prenotazione. ' +
      'Vi richiamiamo per confermare entro poche ore, negli orari di apertura. ' +
      'Se avete fretta, chiamateci allo <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.'
    );

    if (formMsg) {
      // tabindex -1 + focus: скринридер и клавиатура попадают
      // прямо на подтверждение, а не остаются на кнопке.
      formMsg.setAttribute('tabindex', '-1');
      formMsg.focus({ preventScroll: true });
      formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ===================================================================
  //  Отправка
  // ===================================================================

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (submitBtn && submitBtn.disabled) { return; }   // защита от двойного клика

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

    // AbortController: без таймаута зависший запрос оставил бы
    // кнопку заблокированной навсегда.
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
        // Читаем тело в любом случае: осмысленные сообщения приходят
        // и с кодом 422, и с 429. Если вместо JSON пришла HTML-страница
        // ошибки хостинга — json() бросит, ловим ниже.
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
          showSuccess();
          return;
        }

        if (result.data && Array.isArray(result.data.errors) && result.data.errors.length) {
          showErrors(result.data.errors);
          return;
        }

        // Сервер ответил, но не в ожидаемом формате: 500 без JSON,
        // страница-заглушка хостинга, обрыв PHP по фатальной ошибке.
        showFormMessage('error', escapeHtml(MSG.serverError) + '<br>' + callUsHtml());
      })
      .catch(function (error) {
        clearTimeout(timer);
        setLoading(false);

        // Сюда попадаем при обрыве сети, DNS, CORS и по таймауту.
        // Различать их для гостя смысла нет — важно дать телефон.
        var text = (error && error.name === 'AbortError')
          ? 'La richiesta ha impiegato troppo tempo.'
          : MSG.networkError;

        showFormMessage('error', escapeHtml(text) + '<br>' + callUsHtml());

        if (formMsg) { formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
  }

  // ===================================================================
  //  Реакция на правку полей
  // ===================================================================

  // Ошибка снимается, как только гость начал исправлять поле.
  // Держать красную рамку, пока он печатает, — раздражает.
  FIELDS.forEach(function (name) {
    var el = input(name);
    if (!el) { return; }

    var eventName = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' || el.type === 'time')
      ? 'change'
      : 'input';

    el.addEventListener(eventName, function () { clearFieldError(name); });
  });

  // Дата и время определяют тариф — пересчитываем формулу при их смене.
  ['data', 'orario'].forEach(function (name) {
    var el = input(name);
    if (el) { el.addEventListener('change', syncFormula); }
  });

  // Обработчик синхронный СОЗНАТЕЛЬНО. Соблазн отложить его на setTimeout
  // велик, но showSuccess() сам вызывает form.reset() — отложенная очистка
  // стёрла бы сообщение об успешной брони через миллисекунду после показа.
  // Читать значения полей здесь не нужно, а min/max на дате reset не трогает,
  // поэтому ждать окончания сброса незачем.
  form.addEventListener('reset', function () {
    clearAllErrors();
  });

  // ===================================================================
  //  Инициализация
  // ===================================================================

  /** Границы календаря: от сегодня до +6 месяцев.
   *  Это подсказка, а не защита — проверку всё равно делает сервер. */
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
