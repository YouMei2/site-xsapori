# X-Sapori Savona — Table Booking Form

Backend for the form on `prenota.html`: accepting requests, writing to
MySQL, notifying staff by email.

Plain PHP 8.1+ and MySQL. No Composer, no frameworks, no external JS
libraries — everything is designed for ordinary shared hosting where
only PHP and a database are available.

---

## Contents

1. [Where the data goes](#1-where-the-data-goes)
2. [File map](#2-file-map)
3. [Running locally](#3-running-locally)
4. [Viewing bookings](#4-viewing-bookings)
5. [Deploying to hosting](#5-deploying-to-hosting)
6. [Email setup](#6-email-setup)
7. [Post-deployment checks](#7-post-deployment-checks)
8. [Troubleshooting](#8-troubleshooting)
9. [What must be completed manually](#9-what-must-be-completed-manually)
10. [Maintenance](#10-maintenance)

---

## 1. Where the data goes

A booking request goes to **two places**, and it is important not to
confuse them.

### First place: the database — the primary one

The `bookings` table in MySQL. **This is the only reliable storage.**
The write happens first, and until it succeeds the guest gets no
confirmation.

### Second place: email — a notification

After the database write succeeds, staff receive an email with all the
booking details.

**The email is only a notification, not storage.** If mail delivery
fails, the request is still in the database and the guest still sees
«Richiesta inviata». This is deliberate: the booking has already been
accepted, and losing it because of a mail problem is unacceptable.

When sending fails, a line is written to the server log from which the
booking can be recovered by hand:

```
[notify] EMAIL NOT SENT, booking #12: 2026-09-15 20:00, 6 people, Niccolò Rossi, tel. +39 019 XXX XXXX
```

### What does NOT happen

- The data **goes nowhere else**: not to Telegram, not to analytics,
  not to any third-party service.
- **The IP is not stored.** The `ip_hash` field holds a salted SHA-256
  of the IP — the address cannot be recovered from it, but repeat
  requests can still be detected for anti-spam purposes.

### Why no email arrives locally

The local `config.php` has `'enabled' => false` in the `mail` section.
There is nowhere to send mail from a home machine: there is no mail
server. Locally you test the database; on hosting, the database and
the email.

---

## 2. File map

```
Sito ristorante completo/        <- these contents go into public_html
├── index.html                   site pages
├── menu.html
├── prenota.html                 ← booking form
├── chi-siamo.html
├── contatti.html
├── privacy.html                 ← privacy notice (NEEDS WORK, see §9)
├── styles.css
├── js/
│   └── booking.js               client-side validation and submission
├── api/
│   ├── booking.php              ← receives request, validates, writes to DB
│   └── notify.php               builds and sends the email
├── .htaccess                    blocks service files from being downloaded
├── .gitignore
├── schema.sql                   ← do NOT upload to hosting (see §5)
├── config.example.php           config template, no passwords
└── README.md                    this file

config.php                       ← ABOVE public_html, not in git, holds passwords
```

### How it works

```
Guest fills in the form on prenota.html
        │
        ▼
js/booking.js  — checks fields, shows errors next to them,
                 disables the button, sends JSON via fetch
        │
        ▼
api/booking.php — REPEATS all validation (the client cannot be trusted),
                  checks the honeypot and the rate limit,
                  writes a row into bookings
        │
        ├──► response to the guest: {"ok":true,"id":13}
        │
        ▼
api/notify.php — builds the email and sends it to staff
                 (AFTER the guest's response, so they don't wait)
```

Validation is duplicated in two places on purpose. The client-side
check is for convenience — the error appears instantly, without a
round trip. The server-side check is for security: any client-side
check can be bypassed through the browser console in five seconds.
**The single source of truth is `api/booking.php`.**

When changing rules (opening hours, guest limits, the list of set
menus), edit in three places:

| What | Where |
|---|---|
| The real constraints | `config.php` |
| Duplicate for guest-facing hints | `js/booking.js`, constants block at the top |
| Allowed values in the DB | `schema.sql`, the `ENUM` definitions |

---

## 3. Running locally

> **Paths in the examples are placeholders.** Substitute your own:
> `%PHP_DIR%` — folder containing `php.exe`, `%MYSQL_DIR%` — folder
> containing `mysql.exe`, `%PROJECT_DIR%` — the project folder,
> `%PROJECT_PARENT%` — the folder one level above the project, where
> `config.php` lives.

### What you need installed

| Component | Version tested | Where |
|---|---|---|
| PHP | 8.4.24 | `%PHP_DIR%\php.exe` |
| MySQL | 8.0.45 | `%MYSQL_DIR%` |
| Config | — | `%PROJECT_PARENT%\config.php` |

MySQL runs as the `MySQL80` service and starts with Windows — no need
to start it separately.

### Local database users

The local database is called `xsapori_test`. There are two users.

| User | Privileges | Purpose |
|---|---|---|
| `xsapori_web` | SELECT, INSERT, UPDATE | the site runs as this user |
| `xsapori_clean` | + DELETE | only for clearing data during tests |

`xsapori_web` **deliberately has no DELETE privilege** — exactly as it
will be on hosting. If the code ever tries to delete a row, the test
will surface it rather than let it pass.

Passwords are set when the users are created and are kept **only** in
the local `config.php`, which is not committed to git. In the commands
below, the `-p` flag carries no value — mysql will prompt for the
password interactively.

The MySQL **root** password is not used anywhere. It was needed once,
to create the database.

Create the users (once, as root):

```sql
CREATE USER 'xsapori_web'@'localhost'   IDENTIFIED BY 'random_password';
CREATE USER 'xsapori_clean'@'localhost' IDENTIFIED BY 'another_random_password';
GRANT SELECT, INSERT, UPDATE         ON xsapori_test.bookings TO 'xsapori_web'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON xsapori_test.bookings TO 'xsapori_clean'@'localhost';
```

### Start the server

```powershell
cd "%PROJECT_DIR%"
& "%PHP_DIR%\php.exe" -S localhost:8080 -t .
```

Open: **http://localhost:8080/prenota.html**

Stop with `Ctrl+C` in the same window. The server lives as long as the
window stays open.

> **Only `localhost:8080`.** Any other port or address and the form
> gets a **403**. `config.php` lists exactly `http://localhost:8080`
> and `http://127.0.0.1:8080` in `allowed_origins`. This is the same
> protection that on hosting will only allow `xsapori.it`.

### Worth trying

| Action | Expected result |
|---|---|
| Pick a Monday | Accepted — open seven days a week |
| Time 16:00 | «A quell'ora la cucina è chiusa» (between the two services) |
| Time 22:30 | Rejected: last seating is 22:15 |
| Change date to a Saturday | The set-menu list switches to the weekend tariff by itself |
| Pick 25 December | Weekend tariff applies even though it is a weekday |
| Uncheck the consent box | Form will not submit |
| 41 guests | «tra 1 e 40» |
| 4 bookings in a row | The fourth → «Attendete 10 minuti» (limit: 3 per 10 minutes) |

Reset the rate limit:

```powershell
& "%MYSQL_DIR%\mysql.exe" -h 127.0.0.1 -u xsapori_clean -p -D xsapori_test -e "DELETE FROM bookings;"
```

### How local differs from hosting

| | Local | Hosting |
|---|---|---|
| Web server | `php -S` | Apache / LiteSpeed |
| `.htaccess` | **ignored** | active |
| `config.php` | `%PROJECT_PARENT%\config.php` | above `public_html` |
| `fastcgi_finish_request` | absent, `flush()` fallback | usually available |
| Email | disabled | domain mailbox SMTP |

Form logic, validation and database work behave identically locally
and on hosting. Only the server wrapper differs.

---

## 4. Viewing bookings

### All bookings, newest first

```powershell
& "%MYSQL_DIR%\mysql.exe" -h 127.0.0.1 -u xsapori_web -p -D xsapori_test --default-character-set=utf8mb4 -e "SELECT id, booking_date, booking_time, guests, formula, occasion, first_name, last_name, phone, email, status, created_at FROM bookings ORDER BY id DESC;"
```

`--default-character-set=utf8mb4` is mandatory, otherwise Italian
diacritics and any non-Latin characters turn into mojibake in the
console.

### A single booking in full, including notes

`\G` instead of `;` prints the record as a column — easier to read:

```powershell
& "%MYSQL_DIR%\mysql.exe" -h 127.0.0.1 -u xsapori_web -p -D xsapori_test --default-character-set=utf8mb4 -e "SELECT * FROM bookings ORDER BY id DESC LIMIT 1\G"
```

### Useful queries

```sql
-- Unprocessed requests
SELECT * FROM bookings WHERE status = 'new' ORDER BY booking_date, booking_time;

-- Who is coming tomorrow
SELECT booking_time, guests, first_name, last_name, phone, notes
  FROM bookings
 WHERE booking_date = CURDATE() + INTERVAL 1 DAY
   AND status <> 'cancelled'
 ORDER BY booking_time;

-- Everyone who listed allergies or requests
SELECT booking_date, booking_time, first_name, last_name, notes
  FROM bookings
 WHERE notes IS NOT NULL AND notes <> ''
   AND booking_date >= CURDATE();

-- Expected guests per day
SELECT booking_date, COUNT(*) AS prenotazioni, SUM(guests) AS ospiti
  FROM bookings
 WHERE status <> 'cancelled' AND booking_date >= CURDATE()
 GROUP BY booking_date ORDER BY booking_date;
```

### Change a booking's status

Staff called back and confirmed:

```sql
UPDATE bookings SET status = 'confirmed' WHERE id = 13;
UPDATE bookings SET status = 'cancelled' WHERE id = 13;
```

`updated_at` is set automatically — it shows when the status was last
changed.

### On hosting

The same, but through **phpMyAdmin** in the control panel: the SQL
tab, paste the query, run it. Or the Browse tab on the `bookings`
table for simple viewing.

---

## 5. Deploying to hosting

### Step 1. Create the database and user

In the hosting control panel (the «MySQL» / «Database» section):

1. Create the database with character set **utf8mb4** and collation
   **utf8mb4_unicode_ci**.
2. Create a user with a **random password of at least 24 characters**.
   Generate one like this:

   ```powershell
   & "%PHP_DIR%\php.exe" -r "echo bin2hex(random_bytes(16));"
   ```

3. Grant the user **only** `SELECT`, `INSERT`, `UPDATE`. Uncheck
   everything else.

> `DELETE` and `DROP` are withheld deliberately. Even if `config.php`
> leaks completely, an attacker cannot wipe the accumulated bookings.
> `UPDATE` is needed only so staff can change `status`.

If the host provides a MySQL console, the commands are at the end of
`schema.sql` as a commented-out block.

### Step 2. Import the schema

phpMyAdmin → select the database → **Import** tab → upload
`schema.sql` → Go.

Check: the database now contains a `bookings` table with 16 columns
and four indexes.

### Step 3. Lay out the files

```
/home/your_account/
├── config.php               ← ABOVE public_html
└── public_html/
    ├── index.html
    ├── prenota.html
    ├── privacy.html
    ├── ... the other pages
    ├── styles.css
    ├── .htaccess
    ├── js/booking.js
    └── api/
        ├── booking.php
        └── notify.php
```

**Do NOT upload to `public_html`:** `schema.sql`, `README.md`,
`config.example.php`, `.gitignore`. They are only needed during
deployment.

#### Why `config.php` must live above `public_html`

It holds the database password and the mailbox password.

Everything inside `public_html` is reachable by direct URL. While PHP
is working, a request to `config.php` returns a blank page — the file
executes and `return [...]` outputs nothing. But if the PHP handler
breaks — a bad `.htaccess`, a hosting update, a server config error —
the file starts being served **as plain text**, passwords and all.
This is not theoretical; it is a textbook leak scenario.

A file above the site root cannot be served by the web server at all,
no matter how badly PHP breaks.

`booking.php` looks for the config in several locations and takes the
first one found:

1. `../../config.php` relative to `api/` — i.e. next to `public_html`
2. `../../../config.php` — if the structure is deeper
3. `../config.php` — for local development

If no config is found, the form returns 500 and logs where it looked.
It will not silently run without a config.

### Step 4. Fill in `config.php`

Copy `config.example.php` to `config.php`, place it above
`public_html` and fill in:

| Setting | What to put |
|---|---|
| `db.host` | Usually `localhost`. Aruba sometimes gives a separate host in the panel |
| `db.name` | The database name from step 1 |
| `db.user` / `db.pass` | The user and password from step 1 |
| `ip_salt` | **A random 64-character string**, see below |
| `allowed_origins` | Every address the site answers on: with and without `www`, always `https://` |
| `mail.to` | The real staff mailboxes |
| `mail.from` | An address **on your own domain** |

Salt for IP hashing:

```powershell
& "%PHP_DIR%\php.exe" -r "echo bin2hex(random_bytes(32));"
```

> The salt is generated **once and never changed.** Changing it voids
> every stored `ip_hash` and breaks anti-spam for 10 minutes.

Opening hours, the guest limit and the list of set menus are already
filled in from the site's own data — change them only if the schedule
genuinely changed. If so, remember `js/booking.js` and the page text.

### Step 5. Check `.htaccess`

The file is necessary: without it, `schema.sql` and other service
files can be downloaded by direct URL. Verified — they can.

**If the host runs nginx**, `.htaccess` is not read at all. The rules
have to move into the server config, or you ask support:

```nginx
location ~* \.(sql|md|log|bak|old|orig|save|swp|dist|example)$ { deny all; }
location ~* ^/config.*\.php$ { deny all; }
location ~ /\. { deny all; }
location = /api/notify.php { deny all; }
```

---

## 6. Email setup

Two transports to choose from, switched via `mail.transport`.

### Option A: `'transport' => 'mail'`

PHP's built-in function. Nothing to configure.

**The downside to know upfront:** on shared hosting, messages
regularly land in spam, and sometimes `mail()` is simply disabled.
The reason is that the message is sent as a system user such as
`www-data@srv123.hosting.it`, so the recipient's SPF check fails.

The `envelope_sender => true` flag partially fixes this: it passes
`-f` to sendmail, substituting your address. Some hosts forbid `-f` —
then the flag must be turned off, or mail stops going out entirely.

### Option B: `'transport' => 'smtp'` — recommended

A direct connection to your domain's mailbox. The message goes through
your domain's real server, is signed by its SPF/DKIM, and lands in the
inbox rather than in spam.

1. Create a mailbox in the hosting panel, e.g. `no-reply@xsapori.it`.
2. Find the SMTP settings — the same ones you would enter into a phone
   mail client.
3. Fill in:

```php
'transport' => 'smtp',
'smtp' => [
    'host'   => 'smtps.aruba.it',      // from the hosting panel
    'port'   => 587,                    // 587 for STARTTLS, 465 for SSL
    'secure' => 'tls',                  // 'tls' for 587, 'ssl' for 465
    'user'   => 'no-reply@xsapori.it',  // usually the full address
    'pass'   => 'mailbox password',
    'timeout' => 8,
    'verify_peer' => true,
],
```

> `verify_peer` must not be disabled, except where the host is known
> to use a self-signed certificate. Without verification, encryption
> does not protect against server impersonation.

The sending delay is a couple of seconds, but it falls **outside the
guest's response**: the page shows confirmation immediately, the email
goes out afterwards.

### What staff receive

Subject:

```
Prenotazione #42 — 15/09/2026 20:00 · 6 persone · Anna Maria Rossi
```

The body has the date written out in Italian, the time, the number of
guests, the set menu, the occasion, the name, the **phone as a `tel:`
link** (one-tap calling from a smartphone), the email, and any notes
about allergies in a separate yellow block.

`Reply-To` is set to the guest's address: hitting «Reply» writes
straight to the customer. Switched off via `reply_to_guest`.

Each recipient gets **their own separate message** — staff addresses
are not visible to one another, and one failing mailbox does not sink
the rest. This holds for both transports.

### What the guest receives

If the guest filled in the optional email field, they also get a
confirmation. Controlled by `mail.guest_confirmation`.

Subject:

```
Abbiamo ricevuto la vostra richiesta — X-Sapori Savona
```

**This confirms receipt of the request, not the booking itself.** The
site promises a callback («vi richiamiamo per confermare»), and the
table only counts as held once that call happens. Wording that said
«prenotazione confermata» would send a guest to a table that does not
exist on a busy Saturday night. The email therefore carries a
prominent block:

> **La prenotazione non è ancora confermata.**
> Vi richiamiamo entro poche ore, negli orari di apertura, per
> confermare il tavolo.

**Do not soften this wording.** It is the one thing standing between a
web form and a guest turning up to no table.

The rest: a summary of the request, their own notes echoed back, the
phone number as a `tel:` link for changes or cancellation, the address
and opening hours, and a link to the privacy notice.

`Reply-To` points at the **first address in `mail.to`**, not at
`no-reply`. If the guest answers («possiamo spostare alle 21?»), the
reply must reach a human.

No email is sent when: the guest left the email field empty (it is
optional), the address fails validation, or `guest_confirmation` is
`false`. None of these is an error, and none is logged as one.

The two emails are sent **independently**. A failure of one does not
affect the other, and neither affects the booking, which is already in
the database.

---

## 7. Post-deployment checks

In order. Each item takes seconds.

### 7.1. Correct PHP version

Temporarily place `info.php` in `public_html`:

```php
<?php phpinfo();
```

Open `https://xsapori.it/info.php` and check:

- **PHP Version** — 8.1 or higher
- **Server API** — `FPM/FastCGI` (meaning `fastcgi_finish_request`
  works and the guest does not wait for the email)
- **pdo_mysql** present in the PDO section
- **mbstring** and **openssl** loaded

**Delete `info.php` immediately** — it exposes paths, versions and
settings.

### 7.2. Service files are blocked

```
https://xsapori.it/schema.sql          → must be 403 or 404
https://xsapori.it/config.php          → 403 or 404
https://xsapori.it/README.md           → 403 or 404
https://xsapori.it/api/notify.php      → 403
```

If `schema.sql` **downloads**, `.htaccess` is not working. Either the
host runs nginx (see §5) or `AllowOverride` is off. Until it is fixed,
simply delete `schema.sql` from the server.

### 7.3. The API responds

Open `https://xsapori.it/api/booking.php` in a browser. A plain GET.

Expected:

```json
{"ok":false,"errors":[{"field":null,"message":"Metodo non consentito."}]}
```

This is the **correct** response — the endpoint is alive and rejects
GET.

- A blank white page → PHP crashed, check the log
- PHP source code on screen → **PHP is not being processed, critical**
- 500 → most often `config.php` is missing or wrong

### 7.4. A complete booking

Fill in the form on `prenota.html` with real data and submit.

Three things must happen:

1. A green «Richiesta inviata» block on the page
2. A new row in the `bookings` table in phpMyAdmin
3. An email to the address in `mail.to`

If 1 and 2 happen but no email arrives, the problem is only with mail —
the booking was accepted. See §8.

### 7.5. Protections work

| Check | Expectation |
|---|---|
| A Monday in the date field | «Il lunedì siamo chiusi» |
| Time 16:00 | «A quell'ora la cucina è chiusa» |
| Without the consent checkbox | Form does not submit |
| 4 bookings in a row | The fourth → «Attendete 10 minuti» |

### 7.6. HTTPS

The form must work over `https://`. `allowed_origins` must contain
**https addresses**. If the site opens both with and without `www`,
list both, otherwise one of them will get a 403.

---

## 8. Troubleshooting

### Where to find the error log

This is the first place to look. All technical detail goes there,
while the guest gets a generic message without specifics — by design.

- Control panel → «Logs» / «Error log»
- An `error_log` file in the site root or in `api/`
- Sometimes `/home/account/logs/error_log`

All of our entries start with `[booking]` or `[notify]`.

### Errors seen in practice

| Symptom | Cause | What to do |
|---|---|---|
| 500 on every submission | `config.php` not found | The log has a «config.php not found» line listing the paths searched |
| `Access denied for user` | Wrong DB password or host | Compare `db.*` with the hosting panel |
| Form returns **403** | Origin not in the list | Add the address to `allowed_origins`, with and without `www`, always `https://` |
| Booking saved, no email | Mail | See below |
| `mail() returned false` | `mail()` disabled or `-f` blocked | Turn off `envelope_sender`, better still switch to SMTP |
| `SMTP: could not start TLS` | Certificate or port | Check: 587 → `secure=tls`, 465 → `secure=ssl` |
| `SMTP: password check` in the log | Wrong mailbox password | Verify with the same credentials in a mail client |
| `could not connect` to SMTP | Host blocks the outbound port | Ask support whether 587 is open outbound |
| Mojibake instead of `à è ò` | Connection charset | Make sure the DB is `utf8mb4` and the DSN has `charset=utf8mb4` |
| Guest sees the form but nothing happens | JS did not load | Browser console (F12), check the `js/booking.js` path |
| PHP code visible in the browser | PHP is not being processed | A question for the host, critical |

### No email arrives — step by step

1. **Check the log.** Is there a `[notify]` line? If there is none at
   all, `notify.php` was not included — verify the file was uploaded.
2. **Is there `EMAIL NOT SENT`?** Sending failed; the reason is next
   to it in the log. The booking is in the database regardless.
3. **Booking present, no log, no email?** Check `mail.enabled => true`
   and that `mail.to` is filled in.
4. **Everything clean but still no email?** The message was sent but
   not delivered: check the Spam folder, check the domain's SPF.
   Switch to SMTP.

### Nothing helped

Enable in `config.php`:

```php
'debug' => true,
```

Technical detail will start appearing in the JSON response. **Set it
back to `false`** immediately after diagnosing: with `true`, database
internals leak to the outside.

---

## 9. What must be completed manually

Code cannot close these items — they need an owner's decision.

### 9.1. `privacy.html` — mandatory

The page follows the structure of GDPR art. 13, but it is a
**template, not a finished legal document.**

`[DA COMPLETARE]` markers are placed throughout:

- The restaurant's *ragione sociale* and *P. IVA*
- The hosting provider's name
- The date of last update

There is a red warning block at the top of the page. **It must be
removed** once the gaps are filled.

Two points need a lawyer or a *commercialista*:

- **Allergies in the «note» field are health data under GDPR art. 9**,
  a special category. Strictly, they require separate explicit consent
  rather than the general checkbox. The text frames this as «consent
  expressed by voluntarily filling in the field» — a common wording,
  but a debatable one.
- **The address `privacy@xsapori.it`** must exist and be monitored.
  Under GDPR, a request must be answered within a month.

### 9.2. The notification mailbox

`mail.to` currently points at `prenotazioni@xsapori.it`. The mailbox
must exist and be checked regularly. Two addresses are better — if one
fills up, the other still works.

### 9.3. Holiday calendar needs a yearly glance

Set menus are now cross-checked against the date and the time: the
tariff is derived from them, so a guest cannot pick «Cena weekend» for
a Tuesday. On a `giorno festivo` the weekend tariff applies even
mid-week.

The calendar lives in `config.php` under `holidays` (fixed MM-DD
dates), plus Easter Sunday and Easter Monday computed automatically.
Two things to check once a year:

- **`03-18` — Nostra Signora di Misericordia, patron saint of Savona.**
  Included because the city treats it as a holiday. If the restaurant
  does not apply the festive tariff that day, delete the line.
- **`holidays_extra`** takes one-off `YYYY-MM-DD` dates for local
  events or moved observances.

Mirror any change in the `HOLIDAYS` constant at the top of
`js/booking.js`, or the form's auto-selected tariff will disagree with
the server.

### 9.3b. Former issue: set menu not cross-checked (fixed)

A guest can pick «Cena · 24,90 €» and a time of 12:00. The server lets
it through: menu and time are validated independently.

Deliberate — pricing also depends on the day of the week (Weekend
applies on Saturday and Sunday), and a hard link would start rejecting
legitimate bookings. Staff clarify the rate during the confirmation
call.

If you want strict cross-checking, say so and it can be added.

### 9.4. Guest confirmation email — check the wording before launch

Implemented (see §6). One thing needs a decision rather than code:
the email tells the guest their booking is **not yet confirmed** and
that staff will call back.

That matches what the site currently promises. If the restaurant ever
switches to auto-confirming bookings, the wording in
`xs_build_guest_message()` must change at the same time — and so must
the copy on `prenota.html`. Wording that runs ahead of the actual
process is worse than no email at all.

Also worth checking before launch: the constants at the top of
`api/notify.php` (`XS_ADDRESS`, `XS_HOURS`, `XS_PHONE`, `XS_SITE`)
appear in the guest email. They match the site footers today. If the
restaurant moves or changes hours, they change in three places — see
§10.

---

## 10. Maintenance

### Data retention

Under GDPR, personal data must not be kept longer than necessary.
A reasonable retention period for bookings is **24 months**.

Run once a year as an administrative DB user (the site's user has no
`DELETE` privilege):

```sql
DELETE FROM bookings WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 MONTH);
```

The query is commented out at the end of `schema.sql`.

### Backups

Bookings live only in the database. Set up automatic backups in the
hosting panel — most hosts do this daily, but verify the option is on.

Manual export via phpMyAdmin: select the database → Export → SQL
format.

### Changing the schedule

If the restaurant changes its hours or closing day, edit in three
places:

1. `config.php`, the `hours` section — the actual validation
2. `js/booking.js`, the `HOURS` constant — guest-facing hints
3. Text: `prenota.html` (the `aside-card` block and the caption under
   the set menu), the footers of every page, and
   `openingHoursSpecification` in the JSON-LD on `index.html` and
   `prenota.html`

One-off closures (holidays, vacation) go in `config.php` only:

```php
'closed_dates' => ['2026-12-25', '2026-12-26', '2027-01-01'],
```

### Changing prices

Prices appear in `prenota.html` (`<option>` labels), `index.html` (the
pricing block) and in `api/notify.php` (the `xs_formula_label`
function, labels in the staff email).

---

## Appendix: what was tested and how

The backend was exercised against PHP 8.4.24 and MySQL 8.0.45 with
live HTTP requests.

**Passed:**

- `GET` → 405 with an `Allow` header; foreign Origin → 403; malformed
  JSON → 422; a 30 KB body → 422 before parsing
- All validation: dates (including `2027-02-31`, which the browser
  never reaches), opening hours, both service windows, the closing
  day, guest limits, allow-lists for set menus and occasions, name
  lengths, phone, email, consent
- Honeypot: 200 response with no database write
- Rate limit: 3 bookings pass, the fourth → 429 with `Retry-After: 600`
- SQL injection `Rossi'); DROP TABLE bookings;--` stored as plain
  text, table intact
- A 1500-character note truncated to exactly 1000; `Niccolò` and
  `李小龙` preserved correctly; phone normalised
- Email: RFC 2047 subject, `multipart/alternative`, dot-stuffing (a
  line starting with a period does not truncate the message), STARTTLS
  with TLS 1.3, `AUTH LOGIN`
- `verify_peer => true` does reject a self-signed certificate
- A mail failure does not break the booking: the guest gets a 200 and
  a recovery line is written to the log

**Not tested, requires a live server:**

- `.htaccess` — the built-in PHP server ignores it
- `fastcgi_finish_request()` — absent under `php -S`, the fallback
  path was used
- Real-world deliverability — depends on the domain's SPF/DKIM

hehe :
