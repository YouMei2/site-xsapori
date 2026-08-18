<?php
/**
 * X-Sapori Savona — уведомление персонала о новой брони по email.
 *
 * Подключается из booking.php ПОСЛЕ того, как ответ уже ушёл клиенту.
 * Отсюда два правила, которые нельзя нарушать:
 *   1. Ничего не выводить в stdout — ответ уже отправлен.
 *   2. Никогда не бросать исключение наружу без нужды: бронь уже
 *      в базе, и сбой почты не должен ничего ломать. Все ошибки —
 *      в error_log.
 *
 * Два транспорта на выбор (config.php -> mail.transport):
 *   'mail' — встроенная функция mail(). Просто, но на шаред-хостинге
 *            письма часто уходят в спам или теряются без следа.
 *   'smtp' — прямое SMTP-соединение с почтовым ящиком домена.
 *            Медленнее на пару секунд, зато письмо подписано
 *            настоящим сервером домена и доходит.
 *
 * Чистый PHP 8.1+, без Composer и внешних библиотек.
 */

declare(strict_types=1);

// =====================================================================
//  Точка входа
// =====================================================================

/**
 * @param array $cfg конфигурация из config.php
 * @param int   $id  идентификатор созданной брони
 * @param array $b   данные брони (ключи см. в booking.php)
 */
function xs_notify_booking(array $cfg, int $id, array $b): void
{
    $mailCfg = $cfg['mail'] ?? [];

    if (empty($mailCfg['enabled']) || empty($mailCfg['to'])) {
        error_log('[notify] уведомления по email выключены или не указан получатель');
        return;
    }

    try {
        $ok = xs_send_staff_mail($mailCfg, $id, $b);
    } catch (Throwable $e) {
        error_log('[notify] исключение при отправке брони #' . $id . ': ' . $e->getMessage());
        $ok = false;
    }

    if (!$ok) {
        // Единственный оставшийся канал — сама база. Пишем в лог так,
        // чтобы по нему можно было восстановить бронь руками.
        error_log(sprintf(
            '[notify] ПИСЬМО НЕ ОТПРАВЛЕНО, бронь #%d: %s %s, %d чел., %s %s, тел. %s',
            $id,
            $b['date'] ?? '?',
            $b['time'] ?? '?',
            (int) ($b['guests'] ?? 0),
            $b['firstName'] ?? '?',
            $b['lastName'] ?? '?',
            $b['phone'] ?? '?'
        ));
    }
}


// =====================================================================
//  Человеческие названия
// =====================================================================

/** Подписи формул — те же, что видит гость в prenota.html. */
function xs_formula_label(string $v): string
{
    return [
        'pranzo'  => 'Pranzo · 14,90 € a persona',
        'cena'    => 'Cena · 24,90 € a persona',
        'weekend' => 'Weekend · 27,90 € a persona',
    ][$v] ?? $v;
}

function xs_occasion_label(string $v): string
{
    return [
        'nessuna'    => 'Cena normale',
        'compleanno' => 'Compleanno — serve la torta con le candeline',
        'gruppo'     => 'Cena di gruppo o aziendale',
        'famiglia'   => 'Famiglia con bambini — serve il seggiolone',
        'altro'      => 'Altro — vedere le note',
    ][$v] ?? $v;
}

/**
 * "2026-09-15" -> "martedì 15 settembre 2026".
 *
 * Названия зашиты массивами, а не берутся из IntlDateFormatter:
 * расширение intl на шаред-хостинге стоит далеко не всегда,
 * и падать из-за подписи в письме было бы глупо.
 */
function xs_date_it(string $ymd): string
{
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $ymd, new DateTimeZone('Europe/Rome'));
    if ($d === false) {
        return $ymd;
    }

    $giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    $mesi   = [1 => 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
               'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

    return sprintf(
        '%s %d %s %d',
        $giorni[(int) $d->format('w')],
        (int) $d->format('j'),
        $mesi[(int) $d->format('n')],
        (int) $d->format('Y')
    );
}


// =====================================================================
//  Сборка письма
// =====================================================================

/**
 * Убирает из строки перевод строки и возврат каретки.
 *
 * Обязательно для всего, что попадает в заголовки письма: строка
 * с CRLF позволила бы дописать произвольный заголовок и, например,
 * добавить скрытого получателя. Email гостя уже проверен filter_var,
 * но полагаться на одну проверку в таком месте не стоит.
 */
function xs_header_safe(string $v): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $v));
}

/**
 * Кодирует заголовок по RFC 2047, если в нём есть не-ASCII.
 * Побочный полезный эффект: base64 физически не может содержать
 * перевод строки, то есть инъекция через тему письма невозможна.
 */
function xs_encode_header(string $v): string
{
    $v = xs_header_safe($v);

    if (preg_match('/^[\x20-\x7E]*$/', $v)) {
        return $v;
    }

    return '=?UTF-8?B?' . base64_encode($v) . '?=';
}

/**
 * Собирает адрес вида "Nome Cognome" <mail@dominio.it>.
 *
 * Имя гостя приходит из формы, поэтому просто подставить его нельзя.
 * По RFC 5322 display-name без кавычек не имеет права содержать
 * specials — ()<>[]:;@\,." — а имя вроде «Mario Bcc: x@y.z Bianchi»
 * их содержит. Инъекции заголовка тут не выйдет (перевод строки
 * вырезан ещё в booking.php), но снисходительный MTA может разобрать
 * незакавыченную строку неожиданным образом. Поэтому:
 *   - не-ASCII имя      -> кодируем по RFC 2047 (base64, всегда безопасно);
 *   - ASCII со specials -> берём в кавычки с экранированием;
 *   - обычное имя       -> оставляем как есть.
 */
function xs_address(string $email, string $name = ''): string
{
    $email = xs_header_safe($email);
    $name  = xs_header_safe($name);

    if ($name === '') {
        return $email;
    }

    if (!preg_match('/^[\x20-\x7E]*$/', $name)) {
        return xs_encode_header($name) . ' <' . $email . '>';
    }

    if (preg_match('/[()<>\[\]:;@\\\\,."]/', $name)) {
        $name = '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $name) . '"';
    }

    return $name . ' <' . $email . '>';
}

/**
 * Собирает текстовую и HTML-версии письма.
 *
 * @return array{subject:string, text:string, html:string}
 */
function xs_build_message(int $id, array $b): array
{
    $name  = trim(($b['firstName'] ?? '') . ' ' . ($b['lastName'] ?? ''));
    $date  = (string) ($b['date'] ?? '');
    $time  = (string) ($b['time'] ?? '');
    $guests = (int) ($b['guests'] ?? 0);
    $phone = (string) ($b['phone'] ?? '');
    $email = (string) ($b['email'] ?? '');
    $notes = trim((string) ($b['notes'] ?? ''));

    $formula  = xs_formula_label((string) ($b['formula'] ?? ''));
    $occasion = xs_occasion_label((string) ($b['occasion'] ?? ''));

    // Дата в теме — в коротком виде: почтовые клиенты обрезают
    // длинные темы, а самое важное должно остаться видимым.
    $shortDate = $date !== '' ? implode('/', array_reverse(explode('-', $date))) : '?';

    $subject = sprintf(
        'Prenotazione #%d — %s %s · %d persone · %s',
        $id,
        $shortDate,
        $time,
        $guests,
        $name !== '' ? $name : '?'
    );

    // ---------- текстовая версия ----------
    // Нужна не для красоты: часть почтовых клиентов и уведомления
    // на кнопочных телефонах показывают именно её.
    $lines = [
        'NUOVA PRENOTAZIONE #' . $id,
        str_repeat('=', 46),
        '',
        'Data          ' . xs_date_it($date),
        'Orario        ' . $time,
        'Persone       ' . $guests,
        'Formula       ' . $formula,
        'Occasione     ' . $occasion,
        '',
        'Nome          ' . $name,
        'Telefono      ' . $phone,
        'Email         ' . ($email !== '' ? $email : '— non indicata'),
    ];

    if ($notes !== '') {
        $lines[] = '';
        $lines[] = 'NOTE, ALLERGIE E RICHIESTE:';
        $lines[] = str_repeat('-', 46);
        $lines[] = wordwrap($notes, 68, "\n", false);
    }

    $lines[] = '';
    $lines[] = str_repeat('=', 46);
    $lines[] = 'Ricevuta il ' . date('d/m/Y \a\l\l\e H:i') . ' dal modulo di prenotazione.';
    $lines[] = 'Richiamare il cliente per confermare il tavolo.';

    $text = implode("\r\n", $lines);

    // ---------- HTML-версия ----------
    // Верстка нарочно примитивная: таблицы и inline-стили.
    // Gmail вырезает <style> из <head>, Outlook не понимает flex.
    $h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $row = static function (string $label, string $value, bool $strong = false) use ($h): string {
        return '<tr>'
            . '<td style="padding:7px 14px 7px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">' . $h($label) . '</td>'
            . '<td style="padding:7px 0;font-size:15px;color:#111827' . ($strong ? ';font-weight:700' : '') . '">' . $value . '</td>'
            . '</tr>';
    };

    $rows = $row('Data', $h(xs_date_it($date)), true)
        . $row('Orario', $h($time), true)
        . $row('Persone', $h((string) $guests), true)
        . $row('Formula', $h($formula))
        . $row('Occasione', $h($occasion))
        . $row('Nome', $h($name), true)
        // Ссылка tel: — со смартфона персонал звонит в одно касание.
        . $row('Telefono', '<a href="tel:' . $h(str_replace(' ', '', $phone)) . '" style="color:#1f7f9c;font-weight:700;text-decoration:none">' . $h($phone) . '</a>')
        . $row('Email', $email !== ''
            ? '<a href="mailto:' . $h($email) . '" style="color:#1f7f9c">' . $h($email) . '</a>'
            : '<span style="color:#9ca3af">non indicata</span>');

    $notesHtml = '';
    if ($notes !== '') {
        // Примечания выделены жёлтым: аллергия, потерянная в общем
        // списке полей, — это реальный риск для гостя.
        $notesHtml =
            '<div style="margin-top:18px;padding:14px 16px;background:#fef7e0;border-left:4px solid #c9a253;border-radius:4px">'
            . '<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a6d1f;margin-bottom:6px">Note, allergie e richieste</div>'
            . '<div style="font-size:15px;color:#111827;line-height:1.55">' . nl2br($h($notes)) . '</div>'
            . '</div>';
    }

    $html =
        '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        . '<body style="margin:0;padding:20px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">'
        . '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">'
        . '<tr><td style="background:#101315;padding:18px 24px">'
        . '<div style="color:#c9a253;font-size:12px;letter-spacing:.18em;text-transform:uppercase">X·Sapori Savona</div>'
        . '<div style="color:#ffffff;font-size:20px;margin-top:4px">Nuova prenotazione #' . $id . '</div>'
        . '</td></tr>'
        . '<tr><td style="padding:22px 24px">'
        . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">' . $rows . '</table>'
        . $notesHtml
        . '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6">'
        . 'Ricevuta il ' . $h(date('d/m/Y \a\l\l\e H:i')) . ' dal modulo di prenotazione del sito.<br>'
        . 'Richiamare il cliente per confermare il tavolo.'
        . '</p>'
        . '</td></tr></table></body></html>';

    return ['subject' => $subject, 'text' => $text, 'html' => $html];
}


// =====================================================================
//  Отправка
// =====================================================================

function xs_send_staff_mail(array $cfg, int $id, array $b): bool
{
    $msg = xs_build_message($id, $b);

    $recipients = array_values(array_filter(
        array_map('xs_header_safe', (array) ($cfg['to'] ?? [])),
        static fn (string $a): bool => (bool) filter_var($a, FILTER_VALIDATE_EMAIL)
    ));

    if ($recipients === []) {
        error_log('[notify] в mail.to нет ни одного корректного адреса');
        return false;
    }

    $from     = xs_header_safe((string) ($cfg['from'] ?? ''));
    $fromName = (string) ($cfg['from_name'] ?? 'Sito X-Sapori');

    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('[notify] mail.from не является корректным адресом');
        return false;
    }

    // Reply-To на email гостя: персонал жмёт «Ответить» и пишет
    // прямо клиенту, не копируя адрес руками.
    $replyTo = '';
    if (!empty($cfg['reply_to_guest']) && !empty($b['email'])) {
        $guest = xs_header_safe((string) $b['email']);
        if (filter_var($guest, FILTER_VALIDATE_EMAIL)) {
            $replyTo = xs_address($guest, trim(($b['firstName'] ?? '') . ' ' . ($b['lastName'] ?? '')));
        }
    }

    // ---------- MIME ----------
    // multipart/alternative: клиент сам выбирает HTML или текст.
    $boundary = 'xs' . bin2hex(random_bytes(12));

    $body = "This is a multi-part message in MIME format.\r\n\r\n"
        . '--' . $boundary . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        // base64 с переносами по 76 символов: длинные строки
        // нарушают SMTP и портят вложенные UTF-8 символы.
        . chunk_split(base64_encode($msg['text']), 76, "\r\n")
        . "\r\n--" . $boundary . "\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($msg['html']), 76, "\r\n")
        . "\r\n--" . $boundary . "--\r\n";

    $headers = [
        'From'                      => xs_address($from, $fromName),
        'Reply-To'                  => $replyTo !== '' ? $replyTo : xs_address($from, $fromName),
        'MIME-Version'              => '1.0',
        'Content-Type'              => 'multipart/alternative; boundary="' . $boundary . '"',
        'Date'                      => date('r'),
        // Message-ID с доменом отправителя: без него часть фильтров
        // считает письмо подозрительным.
        'Message-ID'                => '<' . bin2hex(random_bytes(10)) . '.' . $id . '@' . substr(strrchr($from, '@') ?: '@localhost', 1) . '>',
        'X-Mailer'                  => 'X-Sapori booking form',
        // Служебное письмо: автоответчики «меня нет в офисе» не нужны.
        'Auto-Submitted'            => 'auto-generated',
        'X-Auto-Response-Suppress'  => 'All',
    ];

    $transport = (string) ($cfg['transport'] ?? 'mail');

    if ($transport === 'smtp') {
        return xs_send_via_smtp($cfg, $recipients, $msg['subject'], $headers, $body, $from);
    }

    return xs_send_via_mail($cfg, $recipients, $msg['subject'], $headers, $body, $from);
}


/**
 * Транспорт 1: встроенная mail().
 */
function xs_send_via_mail(array $cfg, array $to, string $subject, array $headers, string $body, string $from): bool
{
    if (!function_exists('mail')) {
        error_log('[notify] функция mail() отключена на хостинге, переключитесь на transport=smtp');
        return false;
    }

    $headerLines = [];
    foreach ($headers as $k => $v) {
        $headerLines[] = $k . ': ' . $v;
    }

    // -f задаёт envelope sender. Без него хостинг подставляет адрес
    // системного пользователя вроде www-data@srv123.hosting.it,
    // и проверка SPF у получателя проваливается.
    // Некоторые хостинги запрещают -f через safe_mode/restrictions —
    // тогда флаг в конфиге надо выключить.
    $params = !empty($cfg['envelope_sender']) ? '-f' . $from : '';

    $ok = true;
    foreach ($to as $recipient) {
        // Отдельное письмо каждому: получатели не видят друг друга,
        // и отказ одного адреса не топит остальные.
        $sent = @mail(
            $recipient,
            xs_encode_header($subject),
            $body,
            implode("\r\n", $headerLines),
            $params
        );

        if (!$sent) {
            error_log('[notify] mail() вернула false для ' . $recipient);
            $ok = false;
        }
    }

    return $ok;
}


/**
 * Транспорт 2: собственный SMTP-клиент.
 *
 * Пишется руками, потому что на шаред-хостинге нет Composer,
 * а тащить PHPMailer одним файлом — это 5000 строк ради трёх команд.
 * Здесь реализован минимум: EHLO, STARTTLS, AUTH, MAIL/RCPT/DATA.
 */
function xs_send_via_smtp(array $cfg, array $to, string $subject, array $headers, string $body, string $from): bool
{
    $s = $cfg['smtp'] ?? [];

    $host    = (string) ($s['host'] ?? '');
    $port    = (int) ($s['port'] ?? 587);
    $secure  = strtolower((string) ($s['secure'] ?? 'tls'));   // 'tls' | 'ssl' | ''
    $user    = (string) ($s['user'] ?? '');
    $pass    = (string) ($s['pass'] ?? '');
    $timeout = (int) ($s['timeout'] ?? 8);

    if ($host === '') {
        error_log('[notify] transport=smtp, но mail.smtp.host не заполнен');
        return false;
    }

    // ssl:// — шифрование с первого байта (порт 465).
    // Для STARTTLS (порт 587) соединение начинается открытым.
    $endpoint = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;

    $ctx = stream_context_create([
        'ssl' => [
            // Отключать проверку сертификата нельзя: без неё шифрование
            // не защищает от подмены сервера. Флаг оставлен только
            // на случай хостинга с заведомо кривым self-signed.
            'verify_peer'       => (bool) ($s['verify_peer'] ?? true),
            'verify_peer_name'  => (bool) ($s['verify_peer'] ?? true),
            'SNI_enabled'       => true,
        ],
    ]);

    $conn = @stream_socket_client($endpoint, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $ctx);

    if ($conn === false) {
        error_log('[notify] SMTP: не удалось подключиться к ' . $endpoint . ' — ' . $errstr . ' (' . $errno . ')');
        return false;
    }

    stream_set_timeout($conn, $timeout);

    /** Читает ответ сервера целиком (многострочные ответы вида "250-"). */
    $read = static function () use ($conn): array {
        $out = '';
        while (($line = fgets($conn, 1024)) !== false) {
            $out .= $line;
            // Последняя строка ответа: код, затем пробел, а не дефис.
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
            $meta = stream_get_meta_data($conn);
            if ($meta['timed_out']) {
                break;
            }
        }
        return [(int) substr($out, 0, 3), trim($out)];
    };

    $write = static function (string $cmd) use ($conn): void {
        fwrite($conn, $cmd . "\r\n");
    };

    /** Отправляет команду и проверяет код ответа. */
    $expect = static function (?string $cmd, array $codes, string $stage) use ($write, $read): bool {
        if ($cmd !== null) {
            $write($cmd);
        }
        [$code, $raw] = $read();

        if (!in_array($code, $codes, true)) {
            // Пароль в лог не попадает: команда AUTH логируется без аргумента.
            error_log('[notify] SMTP: ' . $stage . ' — сервер ответил "' . $raw . '"');
            return false;
        }
        return true;
    };

    $fail = static function (string $why) use ($conn): bool {
        @fwrite($conn, "QUIT\r\n");
        @fclose($conn);
        if ($why !== '') {
            error_log('[notify] SMTP: прервано на этапе ' . $why);
        }
        return false;
    };

    $ehloName = $_SERVER['SERVER_NAME'] ?? 'localhost';

    if (!$expect(null, [220], 'приветствие'))                       { return $fail(''); }
    if (!$expect('EHLO ' . $ehloName, [250], 'EHLO'))                { return $fail(''); }

    if ($secure === 'tls') {
        if (!$expect('STARTTLS', [220], 'STARTTLS'))                { return $fail(''); }

        $crypto = @stream_socket_enable_crypto(
            $conn,
            true,
            STREAM_CRYPTO_METHOD_TLS_CLIENT   // включает TLS 1.0+, реально согласуется 1.2/1.3
        );
        if ($crypto !== true) {
            error_log('[notify] SMTP: не удалось поднять TLS (проверьте сертификат хоста ' . $host . ')');
            return $fail('');
        }
        // После STARTTLS требуется повторный EHLO уже по шифрованному каналу.
        if (!$expect('EHLO ' . $ehloName, [250], 'EHLO после STARTTLS')) { return $fail(''); }
    }

    if ($user !== '') {
        // AUTH LOGIN: логин и пароль передаются base64 по отдельности.
        // Это не шифрование — поэтому AUTH идёт только после TLS.
        if ($secure === '') {
            error_log('[notify] SMTP: аутентификация без шифрования, пароль уйдёт открытым текстом');
        }
        if (!$expect('AUTH LOGIN', [334], 'AUTH LOGIN'))                       { return $fail(''); }
        if (!$expect(base64_encode($user), [334], 'передача логина'))          { return $fail(''); }
        if (!$expect(base64_encode($pass), [235], 'проверка пароля'))          { return $fail(''); }
    }

    if (!$expect('MAIL FROM:<' . $from . '>', [250], 'MAIL FROM'))             { return $fail(''); }

    $accepted = 0;
    foreach ($to as $recipient) {
        if ($expect('RCPT TO:<' . $recipient . '>', [250, 251], 'RCPT TO ' . $recipient)) {
            $accepted++;
        }
    }
    if ($accepted === 0) {
        return $fail('ни один получатель не принят');
    }

    if (!$expect('DATA', [354], 'DATA')) { return $fail(''); }

    // При SMTP заголовки To и Subject пишем сами — в отличие от mail(),
    // которая добавляет их за нас.
    $full = 'To: ' . implode(', ', $to) . "\r\n"
        . 'Subject: ' . xs_encode_header($subject) . "\r\n";

    foreach ($headers as $k => $v) {
        $full .= $k . ': ' . $v . "\r\n";
    }
    $full .= "\r\n" . $body;

    // Dot-stuffing по RFC 5321: строка, состоящая из одной точки,
    // означает конец письма. Точку в начале любой строки удваиваем,
    // иначе письмо оборвётся на середине.
    $normalized = str_replace("\n", "\r\n", str_replace("\r\n", "\n", $full));
    $full = preg_replace('/^\./m', '..', $normalized) ?? $normalized;

    fwrite($conn, $full . "\r\n.\r\n");

    if (!$expect(null, [250], 'приём письма')) { return $fail(''); }

    $write('QUIT');
    @fclose($conn);

    return true;
}
