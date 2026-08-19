<?php
/**
 * X-Sapori Savona — приём заявок на бронирование столика.
 *
 * POST /api/booking.php
 *   Content-Type: application/json   (основной путь)
 *   Content-Type: application/x-www-form-urlencoded | multipart/form-data (запасной)
 *
 * Ответы:
 *   200 {"ok":true,"id":123}
 *   405 {"ok":false,"errors":[{"field":null,"message":"..."}]}
 *   422 {"ok":false,"errors":[{"field":"data","message":"..."}]}
 *   429 {"ok":false,"errors":[{"field":null,"message":"..."}]}
 *   500 {"ok":false,"errors":[{"field":null,"message":"..."}]}
 *
 * Чистый PHP 8.1+, без Composer и фреймворков.
 */

declare(strict_types=1);

// Пользователь не должен видеть ни одного PHP-предупреждения:
// любая утечка пути или SQL — это подарок атакующему.
// Всё уходит в error_log хостинга.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Все даты и времена считаем в часовом поясе ресторана, а не сервера.
// Хостинг может стоять в UTC — тогда «сегодня» разъедется на два часа.
date_default_timezone_set('Europe/Rome');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// Заголовок Access-Control-Allow-Origin не выставляется СОЗНАТЕЛЬНО:
// без него браузер не отдаст тело ответа стороннему origin.
header('Cache-Control: no-store');


// =====================================================================
//  Утилиты ответа
// =====================================================================

/**
 * Отдаёт JSON и завершает скрипт.
 * Все тексты для пользователя — на итальянском.
 */
function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Одна общая ошибка, не привязанная к полю. */
function fail(int $status, string $message): never
{
    respond($status, ['ok' => false, 'errors' => [['field' => null, 'message' => $message]]]);
}

/**
 * Отдаёт успешный ответ клиенту и продолжает работу скрипта.
 *
 * Нужно, чтобы отправка в Telegram и на почту не заставляла
 * пользователя ждать. На FPM запрос закрывается мгновенно;
 * на mod_php и CGI приходится довольствоваться flush(), который
 * закрывает буфер, но не соединение — там уведомления всё же
 * добавят задержку. Поэтому таймауты в конфиге короткие.
 */
function respond_and_continue(array $payload): void
{
    ignore_user_abort(true);

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    http_response_code(200);
    header('Content-Length: ' . strlen($body));
    echo $body;

    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
        return;
    }
    // Запасной путь для mod_php / CGI.
    if (ob_get_level() > 0) {
        @ob_end_flush();
    }
    @flush();
}


// =====================================================================
//  Загрузка конфигурации
// =====================================================================

/**
 * config.php лежит ВЫШЕ корня сайта, чтобы его нельзя было
 * скачать по прямой ссылке даже при сбое обработчика PHP.
 * Проверяем несколько типовых раскладок шаред-хостингов.
 */
function load_config(): array
{
    $candidates = [
        // public_html/api/booking.php  ->  ../../config.php
        dirname(__DIR__, 2) . '/config.php',
        // на случай вложенности глубже
        dirname(__DIR__, 3) . '/config.php',
        // локальная разработка: рядом с сайтом
        dirname(__DIR__) . '/config.php',
    ];

    foreach ($candidates as $path) {
        if (is_file($path) && is_readable($path)) {
            /** @var array $cfg */
            $cfg = require $path;
            if (is_array($cfg)) {
                return $cfg;
            }
        }
    }

    error_log('[booking] config.php не найден. Искали: ' . implode(', ', $candidates));
    fail(500, 'Configurazione del server non disponibile. Chiamateci allo 019 221 3138.');
}

$cfg = load_config();

// Общий текст для всех технических сбоев: пользователю незачем знать,
// упал PDO, кончилось место на диске или отвалилась сеть.
const MSG_SERVER_ERROR = 'Si è verificato un problema tecnico. Riprovate tra qualche minuto oppure chiamateci allo 019 221 3138.';


// =====================================================================
//  Проверка метода и происхождения запроса
// =====================================================================

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// Preflight не должно быть в принципе: свой же домен, простой POST.
// Отвечаем 405 и не выдаём никаких CORS-заголовков.
if ($method !== 'POST') {
    header('Allow: POST');
    fail(405, 'Metodo non consentito.');
}

/**
 * Проверка «запрос пришёл с нашего сайта».
 *
 * Логика намеренно мягкая: если Origin и Referer отсутствуют оба,
 * запрос пропускаем. Причина — не все связки браузер/прокси шлют
 * Origin на same-origin POST, и жёсткий отказ ломал бы форму
 * у части живых посетителей. Настоящую защиту даёт отсутствие
 * заголовка Access-Control-Allow-Origin: чужой скрипт может
 * отправить запрос, но не может прочитать ответ.
 * Отбрасываем только явно чужой источник.
 */
function origin_allowed(array $allowed): bool
{
    $check = static function (?string $url) use ($allowed): ?bool {
        if ($url === null || $url === '') {
            return null; // заголовка нет — судить не о чем
        }
        $parts = parse_url($url);
        if (!isset($parts['scheme'], $parts['host'])) {
            return null;
        }
        $origin = $parts['scheme'] . '://' . $parts['host']
            . (isset($parts['port']) ? ':' . $parts['port'] : '');

        return in_array($origin, $allowed, true);
    };

    $byOrigin = $check($_SERVER['HTTP_ORIGIN'] ?? null);
    if ($byOrigin !== null) {
        return $byOrigin;
    }

    $byReferer = $check($_SERVER['HTTP_REFERER'] ?? null);
    if ($byReferer !== null) {
        return $byReferer;
    }

    return true; // оба заголовка отсутствуют
}

if (!empty($cfg['allowed_origins']) && !origin_allowed($cfg['allowed_origins'])) {
    error_log('[booking] отклонён чужой origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '?'));
    fail(403, 'Richiesta non consentita.');
}


// =====================================================================
//  Разбор тела запроса
// =====================================================================

/**
 * Основной формат — JSON. Обычная form-data принимается как запасной
 * вариант: если у посетителя отключён JS, форма может уйти нативно.
 */
function read_input(): array
{
    $ctype = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    if (str_contains($ctype, 'application/json')) {
        $raw = file_get_contents('php://input');

        if ($raw === false) {
            fail(422, 'Impossibile leggere i dati inviati.');
        }
        // Форма физически не может весить больше пары килобайт.
        // Отсекаем попытку залить мегабайт мусора до json_decode.
        if (strlen($raw) > 20000) {
            fail(422, 'Dati inviati troppo grandi.');
        }

        try {
            $data = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            fail(422, 'Formato dei dati non valido.');
        }

        return is_array($data) ? $data : [];
    }

    // form-data / x-www-form-urlencoded
    return $_POST;
}

$in = read_input();

/** Достаёт скалярное значение как строку. Массивы и объекты отбрасываем. */
function field(array $src, string $key): string
{
    $v = $src[$key] ?? '';
    if (is_bool($v)) {
        return $v ? '1' : '';
    }
    if (!is_scalar($v)) {
        return '';
    }

    // Убираем ВСЕ управляющие символы, включая \r и \n.
    // Ни одно поле, читаемое через field(), переносов строк не требует
    // (примечания разбираются отдельно, ниже). Зато имя с \r\n, попав
    // в заголовок Reply-To письма, — это классическая инъекция заголовков.
    // Дальше по коду есть ещё две защиты, но резать надо здесь, на входе.
    $s = (string) $v;
    $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s) ?? '';

    return trim($s);
}


// =====================================================================
//  Honeypot
// =====================================================================

$honeypotName = (string) ($cfg['honeypot_field'] ?? 'indirizzo_web');

if (field($in, $honeypotName) !== '') {
    // Отвечаем как при успехе и ничего не пишем в базу.
    // Бот считает, что сработало, и не пробует другие пути.
    error_log('[booking] honeypot сработал, заявка отброшена');
    respond(200, ['ok' => true, 'id' => null]);
}


// =====================================================================
//  Валидация
// =====================================================================

$errors = [];

/** Добавляет ошибку поля. Первая ошибка по полю побеждает. */
function err(array &$errors, ?string $field, string $message): void
{
    foreach ($errors as $e) {
        if ($e['field'] === $field) {
            return;
        }
    }
    $errors[] = ['field' => $field, 'message' => $message];
}

// ---------- дата ----------
$dateRaw = field($in, 'data');
$date    = null;

if ($dateRaw === '') {
    err($errors, 'data', 'Indicate la data della prenotazione.');
} else {
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $dateRaw, new DateTimeZone('Europe/Rome'));
    // Вторая проверка ловит «2026-02-31»: createFromFormat молча
    // превратит такую дату в 3 марта, format() вернёт уже другую строку.
    if ($d === false || $d->format('Y-m-d') !== $dateRaw) {
        err($errors, 'data', 'La data non è valida.');
    } else {
        $today = new DateTimeImmutable('today', new DateTimeZone('Europe/Rome'));

        if ($d < $today) {
            err($errors, 'data', 'Non è possibile prenotare per una data passata.');
        } elseif ($d > $today->modify('+' . (int) ($cfg['max_months_ahead'] ?? 6) . ' months')) {
            err($errors, 'data', 'Accettiamo prenotazioni fino a sei mesi in anticipo. Per date più lontane chiamateci.');
        } elseif (in_array($dateRaw, (array) ($cfg['closed_dates'] ?? []), true)) {
            err($errors, 'data', 'Quel giorno il ristorante è chiuso. Scegliete un\'altra data.');
        } else {
            $date = $d;
        }
    }
}

// ---------- время ----------
$timeRaw = field($in, 'orario');
$time    = null;

/** "HH:MM" -> минуты от полуночи. null, если формат не тот. */
function to_minutes(string $hhmm): ?int
{
    if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $hhmm, $m)) {
        return null;
    }

    return ((int) $m[1]) * 60 + (int) $m[2];
}

if ($timeRaw === '') {
    err($errors, 'orario', 'Indicate l\'orario di arrivo.');
} else {
    // <input type="time"> в некоторых браузерах шлёт HH:MM:SS.
    $timeRaw = substr($timeRaw, 0, 5);
    $minutes = to_minutes($timeRaw);

    if ($minutes === null) {
        err($errors, 'orario', 'L\'orario non è valido.');
    } else {
        $time = $timeRaw;
    }
}

// ---------- праздники ----------

/**
 * Дата католической Пасхи по григорианскому календарю.
 *
 * Алгоритм Meeus/Jones/Butcher. Реализован вручную, а не через
 * easter_date(): та функция живёт в расширении calendar, которого
 * на шаред-хостинге может не оказаться, и падение из-за подсчёта
 * тарифа было бы глупым.
 *
 * @return string дата в формате Y-m-d
 */
function easter_date_for(int $year): string
{
    $a = $year % 19;
    $b = intdiv($year, 100);
    $c = $year % 100;
    $d = intdiv($b, 4);
    $e = $b % 4;
    $f = intdiv($b + 8, 25);
    $g = intdiv($b - $f + 1, 3);
    $h = (19 * $a + $b - $d - $g + 15) % 30;
    $i = intdiv($c, 4);
    $k = $c % 4;
    $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
    $m = intdiv($a + 11 * $h + 22 * $l, 451);

    $month = intdiv($h + $l - 7 * $m + 114, 31);
    $day   = (($h + $l - 7 * $m + 114) % 31) + 1;

    return sprintf('%04d-%02d-%02d', $year, $month, $day);
}

/**
 * Является ли дата праздничной (giorno festivo).
 *
 * В праздник действует тариф выходного дня, даже если это будний день.
 * Учитываются: фиксированные праздники из конфига (включая день
 * покровительницы Савоны), Пасха с Пасхальным понедельником
 * и разовые даты из holidays_extra.
 */
function is_festivo(DateTimeImmutable $d, array $cfg): bool
{
    $ymd = $d->format('Y-m-d');
    $md  = $d->format('m-d');

    if (in_array($md, (array) ($cfg['holidays'] ?? []), true)) {
        return true;
    }

    if (in_array($ymd, (array) ($cfg['holidays_extra'] ?? []), true)) {
        return true;
    }

    if (!empty($cfg['easter_holidays'])) {
        $easter = new DateTimeImmutable(easter_date_for((int) $d->format('Y')), new DateTimeZone('Europe/Rome'));

        // Сама Пасха всегда воскресенье, но проверяем и её:
        // при смене расписания воскресенье может стать будним днём.
        if ($ymd === $easter->format('Y-m-d')) {
            return true;
        }
        // Lunedì dell'Angelo (Pasquetta) — вот ради чего всё это.
        if ($ymd === $easter->modify('+1 day')->format('Y-m-d')) {
            return true;
        }
    }

    return false;
}

/** Итальянские подписи формул — те же, что видит гость в prenota.html. */
function formula_label(string $v): string
{
    return [
        'pranzo_feriale' => 'Pranzo · 14,90 € (da lunedì a venerdì)',
        'cena_feriale'   => 'Cena · 22,90 € (da lunedì a venerdì)',
        'pranzo_weekend' => 'Pranzo · 18,90 € (sabato, domenica e festivi)',
        'cena_weekend'   => 'Cena · 24,90 € (sabato, domenica e festivi)',
    ][$v] ?? $v;
}

// ---------- дата + время вместе: расписание ----------
// Проверяем только когда обе части прошли собственную валидацию,
// иначе получим второе сообщение об ошибке о том же самом.
$service = null;   // 'pranzo' | 'cena' — заполняется ниже по времени

if ($date !== null && $time !== null) {
    $weekday = (int) $date->format('N');           // 1 = понедельник
    $windows = (array) ($cfg['hours'][$weekday] ?? []);
    $minutes = (int) to_minutes($time);
    $cutoff  = (int) ($cfg['last_seating_before_close'] ?? 45);

    if ($windows === []) {
        // Сейчас ресторан открыт все семь дней, поэтому сюда попасть
        // нельзя. Ветка оставлена рабочей на случай, если в config.php
        // снова появится выходной: сообщение общее и не называет день.
        err($errors, 'data', 'Quel giorno il ristorante è chiuso. Scegliete un\'altra data.');
    } else {
        $fits  = false;
        $human = [];

        foreach ($windows as $i => [$open, $close]) {
            $openMin  = (int) to_minutes($open);
            $closeMin = (int) to_minutes($close);
            $lastSeat = $closeMin - $cutoff;

            $human[] = $open . '–' . $close;

            if ($minutes >= $openMin && $minutes <= $lastSeat) {
                $fits = true;
                // Запоминаем, в какую смену попал гость: первое окно —
                // обед, второе — ужин. Отсюда берётся половина формулы.
                $service = $i === 0 ? 'pranzo' : 'cena';
                break;
            }
        }

        if (!$fits) {
            err($errors, 'orario', sprintf(
                'A quell\'ora la cucina è chiusa. Orari di servizio: %s. L\'ultimo ingresso è %d minuti prima della chiusura.',
                implode(' e ', $human),
                $cutoff
            ));
        }
    }

    // Бронь на сегодня, но время уже прошло или слишком близко.
    $now      = new DateTimeImmutable('now', new DateTimeZone('Europe/Rome'));
    $slot     = $date->setTime((int) substr($time, 0, 2), (int) substr($time, 3, 2));
    $minAhead = (int) ($cfg['min_minutes_ahead'] ?? 30);

    if ($slot < $now->modify('+' . $minAhead . ' minutes')) {
        err($errors, 'orario', sprintf(
            'Per oggi accettiamo prenotazioni con almeno %d minuti di anticipo. Per un tavolo subito, chiamateci allo 019 221 3138.',
            $minAhead
        ));
    }
}

// ---------- количество гостей ----------
$guestsRaw = field($in, 'persone');
$guests    = null;
$minG      = (int) ($cfg['min_guests'] ?? 1);
$maxG      = (int) ($cfg['max_guests'] ?? 40);

if ($guestsRaw === '') {
    err($errors, 'persone', 'Indicate quante persone siete.');
} elseif (!preg_match('/^\d{1,3}$/', $guestsRaw)) {
    err($errors, 'persone', 'Il numero di persone non è valido.');
} else {
    $n = (int) $guestsRaw;
    if ($n < $minG || $n > $maxG) {
        err($errors, 'persone', sprintf(
            'Il numero di persone deve essere compreso tra %d e %d. Per gruppi più numerosi chiamateci allo 019 221 3138.',
            $minG,
            $maxG
        ));
    } else {
        $guests = $n;
    }
}

// ---------- формула и повод ----------
// Белый список: значение либо ровно из перечня, либо заявка не проходит.
// ENUM в MySQL при несовпадении в строгом режиме тоже отказал бы,
// но ошибка была бы неинформативной и уже на уровне БД.
$formula  = field($in, 'formula');
$occasion = field($in, 'occasione');

if ($formula === '') {
    $formula = 'cena'; // как selected в prenota.html
}
if (!in_array($formula, (array) $cfg['formulas'], true)) {
    err($errors, 'formula', 'La formula selezionata non è valida.');
}

if ($occasion === '') {
    $occasion = 'nessuna';
}
if (!in_array($occasion, (array) $cfg['occasions'], true)) {
    err($errors, 'occasione', 'L\'occasione selezionata non è valida.');
}

// ---------- формула должна соответствовать дате и времени ----------
// Раньше формула и дата проверялись независимо, и гость мог выбрать
// «Cena weekend» на вторник: заявка проходила, а персонал выяснял
// расхождение уже по телефону. Теперь тариф однозначно выводится
// из даты (будни / выходной или праздник) и времени (обед / ужин).
// Условие смотрит только на поля, от которых зависит тариф.
// Проверять «ошибок нет вообще» нельзя: тогда при опечатке в имени
// расхождение формулы всплыло бы только со второй попытки.
$blocking = false;
foreach ($errors as $e) {
    if (in_array($e['field'], ['data', 'orario', 'formula'], true)) {
        $blocking = true;
        break;
    }
}

if ($date !== null && $service !== null && !$blocking) {
    $weekday = (int) $date->format('N');
    $festivo = is_festivo($date, $cfg);

    $dayType  = ($weekday >= 6 || $festivo) ? 'weekend' : 'feriale';
    $expected = $service . '_' . $dayType;

    if ($formula !== $expected) {
        // Объясняем ПОЧЕМУ, а не просто «неверно»: гость должен понять,
        // что 25 декабря считается праздником, даже если это четверг.
        if ($festivo) {
            $why = sprintf(
                'Il %s è un giorno festivo, quindi si applica la tariffa festiva.',
                $date->format('d/m/Y')
            );
        } elseif ($weekday >= 6) {
            $why = sprintf('Il %s cade nel fine settimana.', $date->format('d/m/Y'));
        } else {
            $why = sprintf(
                'Il %s è un giorno feriale, quindi si applica la tariffa feriale.',
                $date->format('d/m/Y')
            );
        }

        $when = $service === 'pranzo'
            ? 'All\'orario indicato siamo nel servizio di pranzo.'
            : 'All\'orario indicato siamo nel servizio di cena.';

        err($errors, 'formula', sprintf(
            '%s %s La formula corretta è «%s».',
            $why,
            $when,
            formula_label($expected)
        ));
    }
}

// ---------- имя и фамилия ----------
/** Проверяет длину в СИМВОЛАХ, а не в байтах: «Niccolò» это 7 символов и 8 байт. */
function check_name(array &$errors, string $value, string $field, string $emptyMsg, string $lenMsg): ?string
{
    if ($value === '') {
        err($errors, $field, $emptyMsg);
        return null;
    }
    // Схлопываем повторяющиеся пробелы: «Anna   Maria» -> «Anna Maria».
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    $len   = mb_strlen($value, 'UTF-8');

    if ($len < 2 || $len > 60) {
        err($errors, $field, $lenMsg);
        return null;
    }

    return $value;
}

$firstName = check_name(
    $errors,
    field($in, 'nome'),
    'nome',
    'Indicate il vostro nome.',
    'Il nome deve essere lungo tra 2 e 60 caratteri.'
);

$lastName = check_name(
    $errors,
    field($in, 'cognome'),
    'cognome',
    'Indicate il vostro cognome.',
    'Il cognome deve essere lungo tra 2 e 60 caratteri.'
);

// ---------- телефон ----------
$phoneRaw = field($in, 'telefono');
$phone    = null;

if ($phoneRaw === '') {
    err($errors, 'telefono', 'Indicate un numero di telefono: vi richiamiamo per confermare.');
} else {
    // Нормализация: оставляем только цифры и ведущий +.
    // «+39 019 221 3138», «019/2213138», «019-221.3138» -> единый вид.
    $plus   = str_starts_with($phoneRaw, '+') || str_starts_with($phoneRaw, '00');
    $digits = preg_replace('/\D+/', '', $phoneRaw) ?? '';

    // 00 в начале — международный префикс, приводим к +.
    if (str_starts_with($digits, '00')) {
        $digits = substr($digits, 2);
        $plus   = true;
    }

    $len = strlen($digits);

    // 6 цифр — короткий городской, 15 — максимум по E.164.
    if ($len < 6 || $len > 15) {
        err($errors, 'telefono', 'Il numero di telefono non sembra corretto. Esempio: 019 221 3138.');
    } else {
        $phone = ($plus ? '+' : '') . $digits;
    }
}

// ---------- email (необязательный) ----------
$emailRaw = field($in, 'email');
$email    = null;

if ($emailRaw !== '') {
    if (mb_strlen($emailRaw, 'UTF-8') > 190 || !filter_var($emailRaw, FILTER_VALIDATE_EMAIL)) {
        err($errors, 'email', 'L\'indirizzo email non sembra corretto.');
    } else {
        $email = $emailRaw;
    }
}

// ---------- примечания ----------
// Не ошибка, а тихое обрезание: терять уже написанный текст
// из-за лимита обиднее, чем не увидеть хвост длинного сообщения.
$notesRaw = $in['note'] ?? '';
$notes    = null;

if (is_scalar($notesRaw)) {
    $notesRaw = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $notesRaw) ?? '';
    $notesRaw = trim($notesRaw);
    if ($notesRaw !== '') {
        $notes = mb_substr($notesRaw, 0, 1000, 'UTF-8');
    }
}

// ---------- согласие GDPR ----------
// Проверяем строго: чекбокс мог не прийти вовсе, прийти как false,
// как "0" или как "off". Принимаем только явное согласие.
$consentRaw = $in['privacy'] ?? '';
$consent    = in_array(
    is_scalar($consentRaw) ? strtolower(trim((string) $consentRaw)) : '',
    ['1', 'true', 'on', 'yes', 'si', 'sì'],
    true
);

if (!$consent) {
    err($errors, 'privacy', 'Per inviare la richiesta è necessario acconsentire al trattamento dei dati.');
}

// ---------- итог ----------
if ($errors !== []) {
    respond(422, ['ok' => false, 'errors' => $errors]);
}


// =====================================================================
//  Определение IP и его хеширование
// =====================================================================

/**
 * Возвращает IP клиента. Заголовки прокси читаются ТОЛЬКО если
 * это явно разрешено в конфиге: иначе любой желающий подставит
 * X-Forwarded-For и обойдёт rate limit, отправляя каждый запрос
 * с новым «адресом».
 */
function client_ip(bool $trustProxy): string
{
    if ($trustProxy) {
        // Cloudflare отдаёт настоящий IP отдельным заголовком.
        $cf = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
        if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP)) {
            return $cf;
        }
        $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($xff !== '') {
            // Первый адрес в цепочке — исходный клиент.
            $first = trim(explode(',', $xff)[0]);
            if (filter_var($first, FILTER_VALIDATE_IP)) {
                return $first;
            }
        }
    }

    $remote = $_SERVER['REMOTE_ADDR'] ?? '';

    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '0.0.0.0';
}

$salt = (string) ($cfg['ip_salt'] ?? '');

if ($salt === '' || str_starts_with($salt, 'ЗАМЕНИТЕ')) {
    error_log('[booking] ip_salt не задан в config.php — rate limit небезопасен');
}

// hash_hmac, а не hash('sha256', $salt . $ip): HMAC устроен так,
// что длина соли не влияет на стойкость конструкции.
// Результат — 64 hex-символа, ровно под CHAR(64).
$ipHash = hash_hmac('sha256', client_ip((bool) ($cfg['trust_proxy'] ?? false)), $salt);


// =====================================================================
//  Подключение к БД
// =====================================================================

try {
    $db  = $cfg['db'];
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        (int) ($db['port'] ?? 3306),
        $db['name'],
        $db['charset'] ?? 'utf8mb4'
    );

    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Настоящие prepared statements на стороне MySQL.
        // При эмуляции драйвер сам подставляет значения в строку запроса —
        // это работает, но лишает нас гарантии разделения кода и данных.
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
    ]);
} catch (PDOException $e) {
    error_log('[booking] ошибка подключения к БД: ' . $e->getMessage());
    fail(500, MSG_SERVER_ERROR);
}


// =====================================================================
//  Rate limit
// =====================================================================

try {
    $window = (int) ($cfg['rate_limit']['window_min'] ?? 10);
    $maxReq = (int) ($cfg['rate_limit']['max_requests'] ?? 3);

    // Идёт по индексу idx_ratelimit (ip_hash, created_at).
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM bookings
          WHERE ip_hash = :ip
            AND created_at > (NOW() - INTERVAL :win MINUTE)'
    );
    $stmt->bindValue(':ip', $ipHash, PDO::PARAM_STR);
    $stmt->bindValue(':win', $window, PDO::PARAM_INT);
    $stmt->execute();

    if ((int) $stmt->fetchColumn() >= $maxReq) {
        header('Retry-After: ' . ($window * 60));
        respond(429, ['ok' => false, 'errors' => [[
            'field'   => null,
            'message' => sprintf(
                'Avete già inviato diverse richieste. Attendete %d minuti oppure chiamateci allo 019 221 3138.',
                $window
            ),
        ]]]);
    }
} catch (PDOException $e) {
    error_log('[booking] ошибка проверки rate limit: ' . $e->getMessage());
    fail(500, MSG_SERVER_ERROR);
}


// =====================================================================
//  Запись брони
// =====================================================================
// Прямой INSERT, без очередей и промежуточных таблиц: при десятках
// заявок в день вставка в InnoDB занимает около миллисекунды.

try {
    $stmt = $pdo->prepare(
        'INSERT INTO bookings
            (booking_date, booking_time, guests, formula, occasion,
             first_name, last_name, phone, email, notes,
             privacy_consent, ip_hash, status)
         VALUES
            (:date, :time, :guests, :formula, :occasion,
             :first_name, :last_name, :phone, :email, :notes,
             1, :ip_hash, \'new\')'
    );

    $stmt->execute([
        ':date'       => $date->format('Y-m-d'),
        ':time'       => $time . ':00',
        ':guests'     => $guests,
        ':formula'    => $formula,
        ':occasion'   => $occasion,
        ':first_name' => $firstName,
        ':last_name'  => $lastName,
        ':phone'      => $phone,
        ':email'      => $email,
        ':notes'      => $notes,
        ':ip_hash'    => $ipHash,
    ]);

    $bookingId = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    error_log('[booking] ошибка вставки брони: ' . $e->getMessage());
    fail(500, MSG_SERVER_ERROR);
}


// =====================================================================
//  Ответ клиенту, затем уведомления
// =====================================================================
// Бронь уже в базе — с точки зрения пользователя всё готово.
// Telegram и почта не должны заставлять его ждать и тем более
// не должны превращать успешную бронь в ошибку.

respond_and_continue(['ok' => true, 'id' => $bookingId]);

// Уведомление персонала по email. Если файла нет — скрипт просто
// заканчивает работу здесь, бронь всё равно сохранена.
$notifier = __DIR__ . '/notify.php';

if (is_file($notifier)) {
    try {
        require_once $notifier;

        if (function_exists('xs_notify_booking')) {
            xs_notify_booking($cfg, $bookingId, [
                'date'      => $date->format('Y-m-d'),
                'time'      => $time,
                'guests'    => $guests,
                'formula'   => $formula,
                'occasion'  => $occasion,
                'firstName' => $firstName,
                'lastName'  => $lastName,
                'phone'     => $phone,
                'email'     => $email,
                'notes'     => $notes,
            ]);
        }
    } catch (Throwable $e) {
        // Клиент уже получил 200. Любой сбой уведомления —
        // проблема персонала, а не гостя: пишем в лог и молчим.
        error_log('[booking] сбой уведомления для брони #' . $bookingId . ': ' . $e->getMessage());
    }
}
