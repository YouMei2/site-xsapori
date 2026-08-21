# Stato del progetto — 21 agosto 2026

Documento di passaggio: serve a riprendere il lavoro in una conversazione
nuova, o a farlo riprendere a un'altra persona, senza rileggere niente.

---

## Che cos'è

Sito di **X-Sapori**, gran buffet all you can eat in Via Luigi Pirandello 2r,
Savona. Quattro cucine — italiana, brasiliana, cinese, giapponese — ordinate
dal menu e servite al tavolo. Tel. 019 221 3138, aperto 7/7, 12:00–15:00 e
19:00–23:00.

**Stack:** HTML statico + CSS + JavaScript vanilla + PHP 8.1 + MySQL.
Nessun framework, nessuna libreria, nessuna dipendenza npm. Deve poter essere
caricato via FTP su hosting condiviso.

**Cartelle:**
- `D:\Claude Code\x-sapori` — il progetto vero, sotto git
- `C:\xampp\htdocs\x-sapori` — copia di prova locale (ha una password admin
  usa-e-getta e `RewriteBase` in più: **non è quella da pubblicare**)

---

## Com'è fatto

**Tre pagine** invece delle sei iniziali: home (one-page), menu, prenotazione,
più privacy e 404. «Chi siamo» e «Contatti» sono sezioni della home, con
301 dai vecchi indirizzi. Versione inglese completa in `/en/`.

**Direzione visiva «La sala»**, ricavata dalla foto reale del locale.
*Il 21 agosto 2026 il rapporto chiaro/scuro è stato rovesciato*, guardando la
fotografia ad alta risoluzione: la sala è scura, e il sito quasi tutto bianco
non le somigliava. Ora **lo scuro è il registro base e il chiaro è il tavolo** —
le superfici chiare sono riservate a dove si legge o si scrive a lungo: menu,
prezzi, modulo, testi legali. Petrolio per le azioni (`--accent-fill`, che vale
`#17627A` sul chiaro e `#1F7F9C` sullo scuro, dove il primo darebbe 2,71:1),
ottone nei filetti, rosso dei sigilli `#B23A22`.
Font self-hostati: Fraunces, Familjen Grotesk, DM Mono (104 KB in tutto),
**da sostituire più avanti**: il MASTER dice cosa controllare.
Tutto documentato in `design-system/x-sapori/MASTER.md`.

**Fotografie: non ce ne sono.** Al loro posto ci sono tavole grafiche in CSS
costruite sul motivo delle lamelle del soffitto. Il design regge senza foto,
e quando arrivano si sostituisce un `<div>` con un `<img>` senza toccare il
layout. L'hero è già predisposto per un video: bastano due attributi.

---

## Documenti da leggere, in ordine di utilità

| File | A cosa serve |
|---|---|
| `DA-FORNIRE.md` | **Le 11 cose che mancano dal cliente.** Il primo da aprire |
| `ALLERGENI-DA-COMPILARE.md` | Modulo con 67 piatti × 14 allergeni, da far compilare in cucina |
| `DEPLOY.md` | Pubblicazione passo per passo con lista di controllo |
| `MANUTENZIONE.md` | Come cambiare prezzi, orari, piatti, foto senza toccare il codice |
| `PROVA-LOCALE.md` | Come far girare tutto su XAMPP (già fatto) |
| `ACCESSIBILITA.md` | Esito WCAG criterio per criterio |
| `design-system/x-sapori/MASTER.md` | Token, palette, regole visive |

---

## Cosa è stato verificato davvero

Prova completa su XAMPP (Apache su **porta 8080**, PHP 8.2.12, MySQL):

- prenotazione reale dal browser → database → pannello: funziona
- validazione: campi vuoti, data passata, orario fuori apertura, 99 persone,
  consenso mancante — tutti rifiutati con messaggi in italiano
- honeypot: il bot riceve un finto successo, il database resta pulito
- `config.php`, `schema.sql`, `.md`, `api/notify.php` → tutti 403
- intestazioni di sicurezza attive (CSP e altre)
- pannello: accesso, elenco, filtri, CSV, cambio stato, protezione CSRF
- eliminazione definitiva a due passi e cancellazione automatica dopo 24 mesi
- SMTP Brevo: autenticazione e invio verificati sul server reale
- 9 pagine, nessun link rotto, nessuno scroll orizzontale a 375 px
- contrasto: 132 elementi misurati, nessuno sotto soglia

**Non verificato:** l'ambiente di produzione (dominio reale, HTTPS, hosting).

---

## Tre difetti trovati provando dal browser vero

Vale la pena conoscerli: erano tutti diretti in produzione e nessuno si vedeva
dai test automatici.

1. **`allowed_origins` non conteneva il dominio giusto** (`xsapori.it` invece di
   `x-sapori.it`). Ogni prenotazione sarebbe stata rifiutata con «Richiesta non
   consentita», mentre il resto del sito funzionava benissimo.
2. **Il campo trappola anti-bot si chiamava `indirizzo_web`** e i gestori di
   password lo riempivano da soli: il cliente vedeva la conferma, la
   prenotazione spariva nel nulla. Il peggiore dei tre.
3. **Il flag `NE` mancante** nei 301 trasformava `#la-sala` in `%23la-sala`,
   cioè un 404 su ogni vecchio link.

Morale per chi riprende: **le prove con `curl` non bastano.** Serve un browser
vero, possibilmente con un gestore di password installato.

---

## Cosa manca per pubblicare

In ordine, i primi tre bloccano tutto:

1. **Dominio definitivo** — ovunque c'è il segnaposto `www.x-sapori.it`,
   compreso `allowed_origins` in `config.php`
2. **Ragione sociale, P. IVA, provider di hosting, email privacy**
3. **Regola bambini**: altezza o età? Oggi il sito dice «sotto i 120 cm», le
   vecchie FAQ dicevano «gratis fino a 3 anni». Ne può restare una sola
4. Allergeni compilati dalla cucina
5. Foto e video
6. Il resto è in `DA-FORNIRE.md`

**Da fare comunque prima di pubblicare:**

- rigenerare `ip_salt` in `config.php` (quello attuale è finito in un file di
  esempio) e togliere le righe `localhost` da `allowed_origins`
- alzare il numero di versione di `styles.css?v=` e `js/*.js?v=` (vedi
  `DEPLOY.md` §4): senza, chi è già passato riceve HTML nuovo e CSS vecchio
  per sette giorni
- **tradurre in italiano i commenti russi** — vedi qui sotto

### Traduzione dei commenti: da fare prima della consegna

Deciso il 21 agosto 2026. Il sito viene consegnato in Italia, quindi la
documentazione dentro al codice deve essere leggibile da chi lo manterrà.
Sono circa **700 righe su otto file**, in ordine di urgenza:

| File | Righe | Perché conta |
|---|---|---|
| `config.example.php` | 123 | **è il file che si copia a mano** per creare `config.php`: contiene le istruzioni per il sale, l'avvertenza su `trust_proxy`, il divieto di riscrivere l'email di conferma |
| `api/notify.php` | 200 | invio delle email e SMTP |
| `api/booking.php` | 180 | validazione e anti-spam |
| `schema.sql` | 84 | struttura della base dati e permessi MySQL |
| `js/booking.js` | 61 | validazione lato browser |
| `js/prenota-plus.js` | 19 | fasce orarie e contatori |
| `admin/index.php` | 18 | pannello prenotazioni |
| `js/site.js` | 15 | comportamenti comuni |

Nessun testo visibile al pubblico è in russo: sono tutti commenti. Il sito
funziona identico prima e dopo — è una questione di manutenibilità, non di
correttezza.

---

## Come riprendere in una conversazione nuova

Incolla questo:

> Riprendiamo il sito del ristorante X-Sapori in `D:\Claude Code\x-sapori`.
> Leggi `STATO-PROGETTO.md` e `DA-FORNIRE.md` per capire dove siamo.
> [poi dici cosa vuoi fare]

Il resto lo ricostruisco da solo dai file e dalla storia git, che ha un commit
separato e commentato per ogni intervento.
