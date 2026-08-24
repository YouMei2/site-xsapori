// Anteprima locale (solo sviluppo): file statici da qui, PHP da Apache.
//
// Questo server NON esegue PHP e non lo eseguira' mai. Ma dal 25 agosto 2026
// non serve piu' cambiare indirizzo per prenotare: le richieste a `/api/` e
// `/admin/` vengono inoltrate ad Apache sulla 8080, che PHP lo esegue e che
// parla con MySQL. Si sta su http://localhost:4173 per tutto.
//
// XAMPP va comunque acceso: l'inoltro sposta la richiesta, non sostituisce
// il server. Se e' spento, `inoltraAdApache` risponde spiegando cosa fare.
//
// Nella versione precedente `api/booking.php` veniva servito come file
// statico con HTTP 200: il browser riceveva codice PHP al posto del JSON,
// e il modulo mostrava "Si e' verificato un problema tecnico" senza dire
// perche'. Peggio: allo stesso modo si scaricava `config.php`, cioe' la
// password del database e le credenziali SMTP, e il server ascoltava su
// tutte le interfacce di rete invece che solo sul computer locale.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 4173;
const HOST = '127.0.0.1';   // solo questo computer, mai la rete locale

const TYPES = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json',
  '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.avif':'image/avif',
  '.woff2':'font/woff2', '.ico':'image/x-icon', '.webmanifest':'application/manifest+json'
};

// Stessi divieti di .htaccess, cosi' l'anteprima non mostra piu' del sito vero.
const VIETATI = /(\.(php|sql|md|log|bak|old|orig|save|swp|dist|example)$)|(^\.)|(^_)|(^anteprima-)|(^audit-)/i;

// Cartelle intere vietate. `.htaccess` le blocca con RedirectMatch 403, che
// ragiona sul percorso e non sul nome del file: senza questo, l'anteprima
// mostrerebbe `riferimenti/` mentre il sito vero lo nega.
const CARTELLE_VIETATE = /^\/riferimenti(\/|$)/i;

/* --- LE CHIAMATE PHP VANNO AD APACHE -----------------------------------
 * Questo server non esegue PHP e non lo eseguira' mai: e' venti righe di
 * Node. Ma non c'e' nessun motivo per cui prenotare debba costringere a
 * cambiare indirizzo: le richieste a `/api/` e a `/admin/` vengono
 * inoltrate ad Apache, che PHP lo esegue e che parla col database.
 *
 * Risultato: si sta su http://localhost:4173 per tutto — aspetto, moduli
 * e prenotazioni vere — invece di saltare fra due porte.
 *
 * Serve comunque XAMPP acceso, perche' i dati finiscono in MySQL. Se e'
 * spento, l'inoltro fallisce e si torna al messaggio di prima, che spiega
 * cosa fare. Nessun peggioramento rispetto a ieri, solo un caso in piu'
 * che funziona.
 *
 * ATTENZIONE, e' la cosa che confonde: Apache serve la COPIA in
 * C:\xampp\htdocs\x-sapori, non questa cartella. Il PHP che gira e' quello
 * la'. Se tocchi `api/` o `config.php` qui, ricopiali. */
const APACHE = { host: '127.0.0.1', port: 8080, base: '/x-sapori' };
const DA_INOLTRARE = /^\/(api|admin)(\/|$)/i;

function inoltraAdApache(req, res) {
  const opzioni = {
    host: APACHE.host,
    port: APACHE.port,
    method: req.method,
    path: APACHE.base + req.url,
    headers: Object.assign({}, req.headers, { host: APACHE.host + ':' + APACHE.port })
  };

  const su = http.request(opzioni, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });

  su.on('error', () => {
    // XAMPP spento: si risponde come prima, nel formato che il modulo
    // capisce, cosi' al posto di "problema tecnico" si legge cosa fare.
    res.writeHead(503, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({
      ok: false,
      errors: [{
        field: null,
        message: 'XAMPP non risponde sulla porta 8080. Le prenotazioni ' +
                 'passano di la\u0300 perche\u0301 questa anteprima non esegue ' +
                 'PHP. Avviate Apache e MySQL dal pannello XAMPP e riprovate.'
      }]
    }));
  });

  req.pipe(su);
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const nome = path.basename(url);

  if (DA_INOLTRARE.test(url)) { inoltraAdApache(req, res); return; }


  // `/api/` non arriva piu' fin qui: viene inoltrato ad Apache molto prima.
  // Il ramo che rispondeva 501 «questa anteprima non esegue PHP» e' stato
  // tolto perche' adesso e' falso — le prenotazioni dalla 4173 funzionano.
  // Quando XAMPP e' spento il messaggio lo scrive `inoltraAdApache`.
  if (VIETATI.test(nome) || CARTELLE_VIETATE.test(url)) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('403 — file non servito dall\'anteprima locale');
    return;
  }

  let file = path.join(ROOT, url === '/' ? '/index.html' : url);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  fs.stat(file, (err, stat) => {
    if (err || stat.isDirectory()) {
      const alt = path.join(file, 'index.html');
      if (!err && stat.isDirectory() && fs.existsSync(alt)) return send(alt);
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
      res.end('<h1>404</h1><p>' + url + '</p>');
      return;
    }
    send(file);
  });

  function send(f){
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream',
      'Cache-Control':'no-store'
    });
    fs.createReadStream(f).pipe(res);
  }
}).listen(PORT, HOST, () => {
  console.log('Anteprima (senza PHP) su http://' + HOST + ':' + PORT);
  console.log('Per provare le prenotazioni serve XAMPP: http://localhost:8080/x-sapori/');
});
