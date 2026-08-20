# Pubblicazione del sito

Guida passo per passo per mettere online X-Sapori su un hosting condiviso con
PHP 8.1 e MySQL. Tempo previsto: **circa un'ora**, la prima volta.

---

## Prima di cominciare: la lista di quello che serve

- [ ] Dominio registrato e puntato all'hosting
- [ ] Accesso FTP o al file manager del pannello
- [ ] Accesso a phpMyAdmin (o equivalente) per creare il database
- [ ] Certificato HTTPS attivo (quasi tutti gli hosting offrono Let's Encrypt gratis)
- [ ] I dati elencati in `DA-FORNIRE.md`: ragione sociale, P. IVA, email privacy

---

## 1. Sostituire il dominio segnaposto

In tutto il sito c'è il segnaposto `https://www.x-sapori.it`. **Va sostituito
con il dominio vero prima di caricare i file**, altrimenti Google indicizza
indirizzi che non esistono.

I file da correggere: `index.html`, `menu.html`, `prenota.html`, `privacy.html`,
`sitemap.xml`, `robots.txt` e le quattro pagine dentro `en/`.

> ### ⚠️ E soprattutto: `allowed_origins` in `config.php`
>
> È il punto che fa fallire il modulo di prenotazione senza dire perché.
> Il server confronta l'indirizzo da cui arriva la richiesta con quella lista,
> **compresi protocollo e porta**, e se non combacia risponde 403: il cliente
> legge «Richiesta non consentita» e non capisce cosa fare.
>
> Nella lista devono esserci il dominio vero **con e senza `www`**, in `https`.
> Le righe con `localhost` servono solo alle prove: toglietele.
>
> Se dopo la pubblicazione il modulo dà quell'errore, aprite il log degli
> errori del server e cercate `origine non permessa`: la riga contiene
> esattamente l'indirizzo da aggiungere.
>
> Verificato sul campo il 21 agosto: con la porta mancante nella lista, il
> modulo rifiutava ogni invio dal browser pur funzionando da riga di comando.

Con un editor che sappia cercare e sostituire in tutti i file (VS Code,
Notepad++) è un'operazione sola: cercate `www.x-sapori.it`, sostituite con il
vostro dominio, in tutta la cartella.

---

## 2. Creare il database

1. Nel pannello dell'hosting create un database MySQL, per esempio `xsapori`.
2. Create un utente dedicato **solo** per questo database e annotate la password.
   Non usate l'utente `root`.
3. Aprite phpMyAdmin, selezionate il database, andate su **Importa** e caricate
   il file `schema.sql`.
4. Verificate che sia comparsa la tabella `bookings`.

---

## 3. Preparare config.php

`config.php` contiene la password del database: **non deve mai essere
scaricabile**. La soluzione migliore è metterlo **fuori dalla cartella
pubblica**, cioè un livello sopra `public_html`:

```
/home/tuo-utente/
├── config.php          <-- qui, fuori dal web
└── public_html/        <-- la cartella pubblica
    ├── index.html
    ├── api/
    └── …
```

`api/booking.php` lo cerca già in quella posizione. Se il vostro hosting non
permette di uscire dalla cartella pubblica, lasciatelo accanto agli altri file:
il `.htaccess` incluso blocca comunque l'accesso diretto ai file `config*.php`.

Dentro `config.php` impostate:

- `'db'` → host, nome database, utente e password appena creati.
- `'ip_salt'` → **generatene uno nuovo**. Quello incluso è pubblico perché è
  finito in un file di esempio: lasciarlo vanifica la protezione anti-spam.
  Ne generate uno con questo comando, oppure con un generatore di password a 64
  caratteri esadecimali:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

- `'mail'` → indirizzo del ristorante e dati SMTP (vedi punto 5).
- `'admin' => ['password_hash' => '']` → lasciatelo vuoto per ora.

---

## 4. Caricare i file

Caricate nella cartella pubblica tutto **tranne** questi, che servono solo allo
sviluppo:

```
.dev-server.js          server locale di anteprima
anteprima-direzione.html   confronto fra le due varianti grafiche
_audit.js               script di controllo accessibilità
design-system/          documentazione di progetto
DA-FORNIRE.md  MANUTENZIONE.md  DEPLOY.md  README.md
.git/
```

Il `.htaccess` blocca comunque i file `.md` e quelli che iniziano con un punto,
ma non caricarli è più pulito.

Verificate che siano saliti anche i file nascosti: **`.htaccess`** è il più
importante e molti programmi FTP lo nascondono per impostazione predefinita.

---

## 5. Configurare l'invio delle email

Le prenotazioni finiscono nel database in ogni caso; l'email è solo la notifica
al personale. Perché non finisca nello spam:

1. In `config.php`, sezione `'mail'`, mettete l'indirizzo del ristorante in `'to'`.
2. Come `'from'` usate un indirizzo **del vostro dominio**
   (`prenotazioni@vostrodominio.it`), non una casella Gmail: i provider
   rifiutano le email che dichiarano un mittente Gmail arrivando da un altro server.
3. Nel DNS del dominio aggiungete i record **SPF**, **DKIM** e **DMARC**. Il
   vostro hosting fornisce i valori esatti: cercate «record SPF» nella loro
   assistenza.
4. Se usate un servizio SMTP esterno (Brevo, Mailgun, la posta dell'hosting),
   compilate il blocco `'smtp'` con host, porta e credenziali.

---

## 6. Attivare il pannello prenotazioni

1. Aprite `https://vostrodominio.it/admin/`.
2. Scrivete la password che volete usare (almeno 10 caratteri).
3. La pagina restituisce un blocco di testo: copiatelo dentro `config.php`.
4. Ricaricate `/admin/` ed entrate.

Il pannello è accessibile solo via HTTPS in modo sicuro: assicuratevi che il
certificato sia attivo prima di usarlo, altrimenti la password viaggia in chiaro.

---

## 7. Controlli dopo la pubblicazione

Da fare **tutti**, nell'ordine:

- [ ] La home si apre e le foto si vedono
- [ ] I font sono quelli giusti (titoli con le grazie, non Times New Roman):
      se no, il server non serve i `.woff2` — controllate il blocco MIME in `.htaccess`
- [ ] `https://vostrodominio.it/chi-siamo.html` reindirizza alla home:
      il 301 funziona
- [ ] Un indirizzo inventato mostra la pagina 404 personalizzata
- [ ] Il menu: filtri e ricerca funzionano
- [ ] **Prenotazione di prova**: inviate una richiesta vera
  - [ ] compare la schermata di conferma con il riepilogo
  - [ ] la riga appare in `/admin/`
  - [ ] arriva l'email al ristorante (controllate anche lo spam)
  - [ ] cancellate poi la prova dal database
- [ ] Provate il modulo con un campo vuoto: deve comparire l'errore in rosso
- [ ] Aprite il sito dal telefono e provate il menu a tendina
- [ ] `https://vostrodominio.it/sitemap.xml` si apre
- [ ] `https://vostrodominio.it/config.php` restituisce **403 o 404**, mai il contenuto
- [ ] `https://vostrodominio.it/schema.sql` restituisce **403**

---

## 8. Farsi trovare su Google

1. Registrate il sito su **Google Search Console** e inviate la sitemap.
2. Aprite o rivendicate la scheda **Google Business Profile**: per un
   ristorante porta più visite del sito stesso. Mettete gli stessi orari,
   lo stesso indirizzo e lo stesso telefono, scritti identici.
3. Verificate i dati strutturati con il **Rich Results Test** di Google:
   incollate l'indirizzo della home e controllate che riconosca «Restaurant».

---

## 9. Se l'hosting usa nginx invece di Apache

Il file `.htaccess` non viene letto. Le stesse regole vanno tradotte nella
configurazione del server: reindirizzamenti 301, blocco dei file `.sql`, `.md`
e `config*.php`, pagina 404 personalizzata, intestazioni di sicurezza e cache.
Chiedete all'assistenza dell'hosting: è una richiesta standard.

---

## 10. Manutenzione ordinaria

- **Ogni settimana**: date un'occhiata a `/admin/` e archiviate le prenotazioni
  vecchie segnandole come confermate o annullate.
- **Ogni mese**: scaricate il CSV come copia di sicurezza.
- **Ogni sei mesi**: verificate che i prezzi in pagina siano quelli veri e che
  i festivi dell'anno nuovo siano aggiornati in `config.php`.
- **Backup del database**: chiedete all'hosting se è automatico. Se non lo è,
  esportate `bookings` da phpMyAdmin una volta al mese.
