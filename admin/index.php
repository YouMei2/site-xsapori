<?php
declare(strict_types=1);

/**
 * X-Sapori Savona — pannello prenotazioni.
 *
 * Un solo file, nessun framework: si carica via FTP e funziona su
 * qualunque hosting condiviso con PHP 8.1 e MySQL.
 *
 * Cosa fa:
 *   - elenco delle prenotazioni con filtri per data, stato e testo libero;
 *   - cambio di stato (nuova / confermata / annullata);
 *   - esportazione in CSV di quello che si sta guardando.
 *
 * Cosa NON fa di proposito:
 *   - non crea né cancella prenotazioni: si annullano, non si eliminano,
 *     perché lo storico serve a ricostruire le contestazioni;
 *   - non mostra l'indirizzo IP: nel database c'è solo un hash irreversibile.
 *
 * La password sta in config.php, salvata come hash. Se manca, la pagina
 * mostra la procedura per generarla.
 */

// ---------------------------------------------------------------------
//  Errori mai a schermo: rivelerebbero percorsi e struttura del database
// ---------------------------------------------------------------------
ini_set('display_errors', '0');
ini_set('log_errors', '1');

const TENTATIVI_MAX = 5;          // tentativi di accesso prima del blocco
const BLOCCO_SECONDI = 300;       // durata del blocco: cinque minuti
const PER_PAGINA = 50;

// ---------------------------------------------------------------------
//  Configurazione (stessi percorsi usati da api/booking.php)
// ---------------------------------------------------------------------
function carica_config(): array
{
    $candidati = [
        dirname(__DIR__, 2) . '/config.php',
        dirname(__DIR__, 3) . '/config.php',
        dirname(__DIR__) . '/config.php',
    ];

    foreach ($candidati as $percorso) {
        if (is_file($percorso) && is_readable($percorso)) {
            $cfg = require $percorso;
            if (is_array($cfg)) {
                return $cfg;
            }
        }
    }

    error_log('[admin] config.php non trovato. Cercato in: ' . implode(', ', $candidati));
    http_response_code(500);
    exit('Configurazione non disponibile.');
}

$cfg = carica_config();
$hashPassword = (string) ($cfg['admin']['password_hash'] ?? '');

// ---------------------------------------------------------------------
//  Sessione
// ---------------------------------------------------------------------
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'secure'   => $https,
    'samesite' => 'Lax',
]);
session_name('xsapori_admin');
session_start();

function esc(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function token_csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_valido(): bool
{
    return isset($_POST['csrf'], $_SESSION['csrf'])
        && hash_equals((string) $_SESSION['csrf'], (string) $_POST['csrf']);
}

$autenticato = !empty($_SESSION['admin_ok']);

// ---------------------------------------------------------------------
//  Uscita
// ---------------------------------------------------------------------
if (isset($_GET['esci'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: index.php');
    exit;
}

// ---------------------------------------------------------------------
//  Accesso
// ---------------------------------------------------------------------
$erroreLogin = '';

if (!$autenticato && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['password'])) {
    $bloccatoFino = (int) ($_SESSION['blocco_fino'] ?? 0);

    if ($bloccatoFino > time()) {
        $erroreLogin = 'Troppi tentativi. Riprovate fra ' . (int) ceil(($bloccatoFino - time()) / 60) . ' minuti.';
    } elseif ($hashPassword === '') {
        $erroreLogin = 'La password non è ancora configurata.';
    } elseif (password_verify((string) $_POST['password'], $hashPassword)) {
        // ID nuovo dopo l'accesso: evita il session fixation.
        session_regenerate_id(true);
        $_SESSION['admin_ok'] = true;
        $_SESSION['tentativi'] = 0;
        header('Location: index.php');
        exit;
    } else {
        $_SESSION['tentativi'] = (int) ($_SESSION['tentativi'] ?? 0) + 1;
        if ($_SESSION['tentativi'] >= TENTATIVI_MAX) {
            $_SESSION['blocco_fino'] = time() + BLOCCO_SECONDI;
            $_SESSION['tentativi'] = 0;
            $erroreLogin = 'Troppi tentativi. Riprovate fra cinque minuti.';
        } else {
            // Ritardo costante: rende inutile misurare i tempi di risposta.
            usleep(400000);
            $erroreLogin = 'Password errata.';
        }
    }
}

// ---------------------------------------------------------------------
//  Intestazioni comuni
// ---------------------------------------------------------------------
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

// ---------------------------------------------------------------------
//  Prima configurazione: generazione dell'hash
// ---------------------------------------------------------------------
if ($hashPassword === '') {
    $generato = '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !empty($_POST['nuova'])) {
        $nuova = (string) $_POST['nuova'];
        if (mb_strlen($nuova) < 10) {
            $generato = 'ERRORE: usate almeno 10 caratteri.';
        } else {
            $generato = password_hash($nuova, PASSWORD_DEFAULT);
        }
    }
    pagina_inizio('Configurazione');
    ?>
    <div class="scheda">
      <h1>Pannello non ancora configurato</h1>
      <p>Serve una password. Scrivetela qui sotto: questa pagina genera il codice
         cifrato da incollare in <code>config.php</code>. La password in chiaro
         non viene salvata da nessuna parte.</p>

      <form method="post" class="riga">
        <label for="nuova">Password scelta</label>
        <input type="password" id="nuova" name="nuova" minlength="10" required autocomplete="new-password">
        <button type="submit">Genera il codice</button>
      </form>

      <?php if ($generato !== ''): ?>
        <p style="margin-top:1.5rem"><strong>Incollate questo blocco in <code>config.php</code>,
           dentro l'array principale:</strong></p>
        <pre><?= esc("    'admin' => [\n        'password_hash' => '" . $generato . "',\n    ],") ?></pre>
        <p>Poi ricaricate questa pagina ed entrate con la password scelta.</p>
      <?php endif; ?>
    </div>
    <?php
    pagina_fine();
    exit;
}

// ---------------------------------------------------------------------
//  Schermata di accesso
// ---------------------------------------------------------------------
if (!$autenticato) {
    pagina_inizio('Accesso');
    ?>
    <div class="scheda scheda--stretta">
      <h1>Prenotazioni</h1>
      <p>Area riservata al personale di X-Sapori.</p>

      <?php if ($erroreLogin !== ''): ?>
        <p class="avviso avviso--errore" role="alert"><?= esc($erroreLogin) ?></p>
      <?php endif; ?>

      <form method="post" class="riga">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" autofocus>
        <button type="submit">Entra</button>
      </form>
    </div>
    <?php
    pagina_fine();
    exit;
}

// ---------------------------------------------------------------------
//  Da qui in poi si è autenticati: connessione al database
// ---------------------------------------------------------------------
try {
    $db = $cfg['db'];
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
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log('[admin] connessione al database fallita: ' . $e->getMessage());
    pagina_inizio('Errore');
    echo '<div class="scheda"><h1>Database non raggiungibile</h1>'
       . '<p>Le prenotazioni ci sono, ma il pannello non riesce a leggerle. '
       . 'Controllate i dati di accesso in config.php.</p></div>';
    pagina_fine();
    exit;
}

// ---------------------------------------------------------------------
//  Cambio di stato
// ---------------------------------------------------------------------
$messaggio = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['azione'])) {
    if (!csrf_valido()) {
        $messaggio = 'Richiesta non valida: ricaricate la pagina e riprovate.';
    } else {
        $id = (int) ($_POST['id'] ?? 0);
        $stati = ['new' => 'nuova', 'confirmed' => 'confermata', 'cancelled' => 'annullata'];
        $nuovo = (string) $_POST['azione'];

        if ($id > 0 && isset($stati[$nuovo])) {
            $q = $pdo->prepare('UPDATE bookings SET status = ? WHERE id = ?');
            $q->execute([$nuovo, $id]);
            $messaggio = 'Prenotazione #' . $id . ' segnata come ' . $stati[$nuovo] . '.';
        }
    }
}

// ---------------------------------------------------------------------
//  Filtri
// ---------------------------------------------------------------------
$oggi = date('Y-m-d');
$da = (string) ($_GET['da'] ?? $oggi);
$a  = (string) ($_GET['a'] ?? '');
$stato = (string) ($_GET['stato'] ?? '');
$cerca = trim((string) ($_GET['cerca'] ?? ''));
$pagina = max(1, (int) ($_GET['p'] ?? 1));

$valida = static fn(string $d): bool => (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
if (!$valida($da)) { $da = $oggi; }
if ($a !== '' && !$valida($a)) { $a = ''; }
if (!in_array($stato, ['new', 'confirmed', 'cancelled'], true)) { $stato = ''; }

$dove = ['booking_date >= ?'];
$par  = [$da];

if ($a !== '')      { $dove[] = 'booking_date <= ?'; $par[] = $a; }
if ($stato !== '')  { $dove[] = 'status = ?';        $par[] = $stato; }
if ($cerca !== '')  {
    $dove[] = '(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    $like = '%' . $cerca . '%';
    array_push($par, $like, $like, $like, $like);
}

$sqlDove = implode(' AND ', $dove);

// ---------------------------------------------------------------------
//  Esportazione CSV (stessi filtri della schermata)
// ---------------------------------------------------------------------
if (isset($_GET['csv'])) {
    $q = $pdo->prepare("SELECT * FROM bookings WHERE $sqlDove ORDER BY booking_date, booking_time");
    $q->execute($par);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="prenotazioni-' . date('Y-m-d') . '.csv"');

    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");   // BOM: Excel apre l'UTF-8 senza sporcare gli accenti
    fputcsv($out, ['ID', 'Data', 'Ora', 'Persone', 'Formula', 'Occasione',
                   'Nome', 'Cognome', 'Telefono', 'Email', 'Note', 'Stato', 'Ricevuta il'], ';');

    while ($r = $q->fetch()) {
        fputcsv($out, [
            $r['id'], $r['booking_date'], substr((string) $r['booking_time'], 0, 5),
            $r['guests'], $r['formula'], $r['occasion'],
            $r['first_name'], $r['last_name'], $r['phone'], $r['email'],
            $r['notes'], $r['status'], $r['created_at'],
        ], ';');
    }
    fclose($out);
    exit;
}

// ---------------------------------------------------------------------
//  Lettura della pagina corrente
// ---------------------------------------------------------------------
$conta = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE $sqlDove");
$conta->execute($par);
$totale = (int) $conta->fetchColumn();
$pagine = max(1, (int) ceil($totale / PER_PAGINA));
$pagina = min($pagina, $pagine);
$salta = ($pagina - 1) * PER_PAGINA;

$q = $pdo->prepare(
    "SELECT * FROM bookings WHERE $sqlDove ORDER BY booking_date, booking_time LIMIT " . PER_PAGINA . " OFFSET " . $salta
);
$q->execute($par);
$righe = $q->fetchAll();

// Riepilogo del giorno: quello che serve sapere prima del servizio
$oggiQ = $pdo->prepare(
    "SELECT COUNT(*) AS n, COALESCE(SUM(guests), 0) AS coperti
       FROM bookings WHERE booking_date = ? AND status <> 'cancelled'"
);
$oggiQ->execute([$oggi]);
$riepilogo = $oggiQ->fetch() ?: ['n' => 0, 'coperti' => 0];

$ETICHETTE_FORMULA = [
    'pranzo_feriale' => 'Pranzo feriale',
    'cena_feriale'   => 'Cena feriale',
    'pranzo_weekend' => 'Pranzo weekend',
    'cena_weekend'   => 'Cena weekend',
];
$ETICHETTE_OCCASIONE = [
    'nessuna'    => '',
    'compleanno' => 'Compleanno',
    'gruppo'     => 'Gruppo',
    'famiglia'   => 'Famiglia',
    'altro'      => 'Altro',
];
$ETICHETTE_STATO = [
    'new'       => 'Nuova',
    'confirmed' => 'Confermata',
    'cancelled' => 'Annullata',
];

pagina_inizio('Prenotazioni');
?>

<header class="testata">
  <h1>Prenotazioni</h1>
  <p class="sommario">
    <strong><?= (int) $riepilogo['n'] ?></strong> prenotazioni oggi ·
    <strong><?= (int) $riepilogo['coperti'] ?></strong> coperti attesi
  </p>
  <a class="esci" href="index.php?esci=1">Esci</a>
</header>

<?php if ($messaggio !== ''): ?>
  <p class="avviso" role="status"><?= esc($messaggio) ?></p>
<?php endif; ?>

<form class="filtri" method="get">
  <div>
    <label for="da">Dal</label>
    <input type="date" id="da" name="da" value="<?= esc($da) ?>">
  </div>
  <div>
    <label for="a">Al</label>
    <input type="date" id="a" name="a" value="<?= esc($a) ?>">
  </div>
  <div>
    <label for="stato">Stato</label>
    <select id="stato" name="stato">
      <option value="">Tutti</option>
      <option value="new"       <?= $stato === 'new' ? 'selected' : '' ?>>Nuove</option>
      <option value="confirmed" <?= $stato === 'confirmed' ? 'selected' : '' ?>>Confermate</option>
      <option value="cancelled" <?= $stato === 'cancelled' ? 'selected' : '' ?>>Annullate</option>
    </select>
  </div>
  <div>
    <label for="cerca">Nome, telefono o email</label>
    <input type="search" id="cerca" name="cerca" value="<?= esc($cerca) ?>" placeholder="Es. Rossi">
  </div>
  <div class="filtri__azioni">
    <button type="submit">Filtra</button>
    <a class="bottone bottone--vuoto" href="index.php">Azzera</a>
    <a class="bottone bottone--vuoto" href="?<?= esc(http_build_query(
        ['da' => $da, 'a' => $a, 'stato' => $stato, 'cerca' => $cerca, 'csv' => 1]
    )) ?>">Scarica CSV</a>
  </div>
</form>

<p class="conteggio"><?= $totale ?> <?= $totale === 1 ? 'prenotazione trovata' : 'prenotazioni trovate' ?></p>

<?php if (!$righe): ?>
  <div class="vuoto">
    <p>Nessuna prenotazione con questi filtri.</p>
    <p><a href="index.php">Torna all'elenco di oggi</a></p>
  </div>
<?php else: ?>
<div class="tabella-wrap">
<table>
  <caption class="sr">Elenco delle prenotazioni filtrate</caption>
  <thead>
    <tr>
      <th scope="col">Quando</th>
      <th scope="col">Pers.</th>
      <th scope="col">Cliente</th>
      <th scope="col">Contatti</th>
      <th scope="col">Formula</th>
      <th scope="col">Note</th>
      <th scope="col">Stato</th>
      <th scope="col">Azioni</th>
    </tr>
  </thead>
  <tbody>
  <?php foreach ($righe as $r):
      $quando = date('d/m/Y', strtotime((string) $r['booking_date']));
      $ora = substr((string) $r['booking_time'], 0, 5);
      $occ = $ETICHETTE_OCCASIONE[$r['occasion']] ?? '';
  ?>
    <tr class="stato-<?= esc($r['status']) ?>">
      <td class="mono"><?= esc($quando) ?><br><strong><?= esc($ora) ?></strong></td>
      <td class="mono num"><?= (int) $r['guests'] ?></td>
      <td>
        <?= esc($r['first_name'] . ' ' . $r['last_name']) ?>
        <?php if ($occ !== ''): ?><br><span class="etichetta"><?= esc($occ) ?></span><?php endif; ?>
      </td>
      <td class="mono">
        <a href="tel:<?= esc(preg_replace('/[^0-9+]/', '', (string) $r['phone'])) ?>"><?= esc($r['phone']) ?></a>
        <?php if (!empty($r['email'])): ?><br><a href="mailto:<?= esc($r['email']) ?>"><?= esc($r['email']) ?></a><?php endif; ?>
      </td>
      <td><?= esc($ETICHETTE_FORMULA[$r['formula']] ?? $r['formula']) ?></td>
      <td class="note"><?= esc((string) $r['notes']) ?></td>
      <td><span class="pillola pillola--<?= esc($r['status']) ?>"><?= esc($ETICHETTE_STATO[$r['status']]) ?></span></td>
      <td class="azioni">
        <form method="post">
          <input type="hidden" name="csrf" value="<?= esc(token_csrf()) ?>">
          <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
          <?php if ($r['status'] !== 'confirmed'): ?>
            <button type="submit" name="azione" value="confirmed">Conferma</button>
          <?php endif; ?>
          <?php if ($r['status'] !== 'cancelled'): ?>
            <button type="submit" name="azione" value="cancelled" class="bottone--rosso">Annulla</button>
          <?php endif; ?>
          <?php if ($r['status'] !== 'new'): ?>
            <button type="submit" name="azione" value="new" class="bottone--vuoto">Riapri</button>
          <?php endif; ?>
        </form>
      </td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
</div>

<?php if ($pagine > 1): ?>
  <nav class="pagine" aria-label="Pagine dei risultati">
    <?php for ($i = 1; $i <= $pagine; $i++): ?>
      <?php if ($i === $pagina): ?>
        <span aria-current="page"><?= $i ?></span>
      <?php else: ?>
        <a href="?<?= esc(http_build_query(
            ['da' => $da, 'a' => $a, 'stato' => $stato, 'cerca' => $cerca, 'p' => $i]
        )) ?>"><?= $i ?></a>
      <?php endif; ?>
    <?php endfor; ?>
  </nav>
<?php endif; ?>
<?php endif; ?>

<?php
pagina_fine();


// =====================================================================
//  Cornice della pagina
//  Stile a parte: il pannello è uno strumento di lavoro, non deve
//  dipendere dal foglio di stile del sito pubblico.
// =====================================================================
function pagina_inizio(string $titolo): void
{
    ?><!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= esc($titolo) ?> · X-Sapori</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="../assets/brand/favicon.svg" type="image/svg+xml">
<style>
  :root{
    --sfondo:#FBF9F5; --carta:#fff; --testo:#14191C; --tenue:#5A6468;
    --bordo:rgba(20,25,28,.14); --petrolio:#17627A; --rosso:#A32B1F; --verde:#1E6B4F;
  }
  *,*::before,*::after{box-sizing:border-box;}
  body{
    margin:0;padding:1.5rem;background:var(--sfondo);color:var(--testo);
    font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;
  }
  h1{font-size:1.6rem;margin:0;}
  a{color:var(--petrolio);}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);}
  .testata{
    display:flex;flex-wrap:wrap;gap:1rem;align-items:center;
    padding-bottom:1rem;border-bottom:2px solid var(--bordo);margin-bottom:1.5rem;
  }
  .sommario{margin:0;color:var(--tenue);}
  .esci{margin-left:auto;}
  .scheda{
    background:var(--carta);border:1px solid var(--bordo);border-radius:8px;
    padding:2rem;max-width:760px;margin:3rem auto;
  }
  .scheda--stretta{max-width:420px;}
  .riga{display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;margin-top:1.2rem;}
  .riga label{display:block;font-size:.85rem;color:var(--tenue);margin-bottom:.25rem;}
  input,select,button,.bottone{
    font:inherit;min-height:44px;padding:.55rem .8rem;
    border:1px solid var(--bordo);border-radius:6px;background:var(--carta);
  }
  input:focus-visible,select:focus-visible,button:focus-visible,a:focus-visible{
    outline:3px solid var(--petrolio);outline-offset:2px;
  }
  button,.bottone{
    background:var(--petrolio);color:#fff;border-color:var(--petrolio);
    cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;
  }
  button:hover,.bottone:hover{filter:brightness(1.12);}
  .bottone--vuoto,button.bottone--vuoto{background:var(--carta);color:var(--testo);border-color:var(--bordo);}
  .bottone--rosso,button.bottone--rosso{background:var(--rosso);border-color:var(--rosso);}
  .filtri{
    display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-end;
    background:var(--carta);border:1px solid var(--bordo);border-radius:8px;padding:1rem;
  }
  .filtri label{display:block;font-size:.8rem;color:var(--tenue);margin-bottom:.25rem;}
  .filtri__azioni{display:flex;gap:.5rem;flex-wrap:wrap;margin-left:auto;}
  .conteggio{color:var(--tenue);margin:1rem 0 .5rem;}
  .tabella-wrap{overflow-x:auto;background:var(--carta);border:1px solid var(--bordo);border-radius:8px;}
  table{border-collapse:collapse;width:100%;min-width:900px;}
  th,td{padding:.7rem .8rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--bordo);}
  th{font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--tenue);
     background:var(--sfondo);position:sticky;top:0;}
  .mono{font-family:ui-monospace,Consolas,monospace;font-size:.9rem;}
  .num{text-align:right;font-variant-numeric:tabular-nums;}
  .note{max-width:22ch;font-size:.9rem;color:var(--tenue);}
  tr.stato-cancelled td{opacity:.5;text-decoration:line-through;}
  tr.stato-new{background:#FFFDF4;}
  .pillola{
    display:inline-block;padding:.15rem .55rem;border-radius:999px;
    font-size:.75rem;border:1px solid var(--bordo);white-space:nowrap;
  }
  .pillola--new{border-color:#B98D4A;color:#8A6A2F;}
  .pillola--confirmed{border-color:var(--verde);color:var(--verde);}
  .pillola--cancelled{border-color:var(--bordo);color:var(--tenue);}
  .azioni form{display:flex;gap:.35rem;flex-wrap:wrap;}
  .azioni button{min-height:38px;padding:.35rem .7rem;font-size:.85rem;}
  .etichetta{font-size:.75rem;color:#8A6A2F;}
  .avviso{
    background:#E9F4EE;border:1px solid rgba(30,107,79,.4);color:var(--verde);
    padding:.8rem 1rem;border-radius:6px;
  }
  .avviso--errore{background:#FBEDEB;border-color:rgba(163,43,31,.4);color:var(--rosso);}
  .vuoto{
    background:var(--carta);border:1px dashed var(--bordo);border-radius:8px;
    padding:3rem 1rem;text-align:center;color:var(--tenue);
  }
  .pagine{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:1.2rem;}
  .pagine a,.pagine span{
    min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;
    border:1px solid var(--bordo);border-radius:6px;text-decoration:none;background:var(--carta);
  }
  .pagine span[aria-current]{background:var(--petrolio);color:#fff;border-color:var(--petrolio);}
  pre{background:#14191C;color:#E7EDEF;padding:1rem;border-radius:6px;overflow-x:auto;font-size:.85rem;}
  code{background:rgba(20,25,28,.07);padding:.1rem .3rem;border-radius:3px;}
  @media (max-width:640px){ body{padding:.75rem;} .filtri__azioni{margin-left:0;} }
</style>
</head>
<body>
<?php
}

function pagina_fine(): void
{
    echo "\n</body>\n</html>\n";
}
