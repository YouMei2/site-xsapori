# Stato del progetto — 23 agosto 2026

Documento di passaggio: serve a riprendere il lavoro in una conversazione
nuova, o a farlo riprendere a un'altra persona, senza rileggere niente.

---

## Che cos'è

Sito di **X-Sapori**, gran buffet all you can eat in Via Luigi Pirandello 2r,
Savona. Tel. 019 221 3138, aperto 7/7, 12:00–15:00 e 19:00–23:00.

**Come funziona il locale — e attenzione, perché il sito lo diceva sbagliato
fino al 22 agosto.** È un **buffet**: ci si serve da soli al banco, non si
ordina, non c'è un cameriere che prende le comande e non c'è un tablet. Ogni
tanto il personale passa fra i tavoli con qualcosa che al banco non c'è —
carne girata alla brace, ananas, un dolce — ma non è fisso e non va promesso
come un servizio.

**Stack:** HTML statico + CSS + JavaScript vanilla + PHP 8.1 + MySQL.
Nessun framework, nessuna dipendenza npm. Deve poter essere caricato via FTP
su hosting condiviso.

**Cartelle:**
- `D:\Claude Code\x-sapori` — il progetto vero, sotto git
- `C:\xampp\htdocs\x-sapori` — copia di prova locale (ha una password admin
  usa-e-getta e `RewriteBase` in più: **non è quella da pubblicare**)

**Per provare:** Apache su `http://localhost:8080/x-sapori/`. Va avviato a
mano dal pannello XAMPP, non è un servizio. C'è anche un'anteprima statica
sulla porta 4173 (`.dev-server.js`) che **non esegue PHP**: le prenotazioni
lì non funzionano, e il modulo lo dice esplicitamente.

---

## Com'è fatto

**Tre pagine** più privacy e 404, e la versione inglese completa in `/en/`.

**Direzione visiva «La sala»**, ricavata dalla fotografia reale del locale.

> **Il 21 agosto il rapporto chiaro/scuro è stato rovesciato.** Prima il
> chiaro era dominante; guardando la foto ad alta risoluzione il sito non
> somigliava al locale. Ora vale: **scuro = la sala, chiaro = il tavolo.**
> Le superfici chiare sono riservate a dove si legge o si scrive a lungo —
> menu, prezzi, modulo, testi legali. Tutto in `design-system/x-sapori/MASTER.md`.

Dietro tutto c'è **la pietra**: la texture del marmo della sala a velatura
88%, che toglie al buio l'aspetto di colore piatto. 72 KB per tutto il sito.

> **È uno strato solo, fisso, a tutto schermo** (`body::before`), e da questo
> discende **la regola più facile da rompere: le sezioni scure devono essere
> translucide.** Se una dichiara un fondo pieno, ci dipinge sopra e la pietra
> si spegne lì. Il fondo pieno lo prende solo `body` — e `.drawer`, che copre
> la pagina. *(Rifatto il 24 agosto 2026: prima era un `background-image` con
> `background-size:1100px` e `repeat`, quindi la piastrella si ripeteva con
> una cucitura visibile, e metà delle sezioni ci dipingevano sopra un colore
> pieno. Sembravano due immagini tagliate e accostate.)*

**Le fotografie ci sono.** Tredici immagini WebP in `uploads/`, montate il
23 agosto. Il principio è **poche e grandi**: una foto sta dove può respirare,
oppure non sta. Per questo **le quattro card delle cucine restano grafiche** —
è una scelta, non una mancanza, ed è scritta sopra la griglia in `index.html`.

**Nessun video esiste.** *(Corretto il 24 agosto 2026: fino a oggi questo
documento affermava che `sala-hero` e `banco-carrellata` fossero pronti in
`uploads/` in WebM e MP4. È falso — nella cartella non c'è nessun `.webm`
né `.mp4`, e git non ne traccia nessuno.)*

**L'impianto però c'è, ed è completo.** `js/site.js:65` costruisce il
`<video>` non appena `.hero__bg` dichiara `data-video`: muto, in loop, con
poster, pulsante di pausa WCAG 2.2.2 e blocco su rete lenta o «riduci
movimento». Aspetta solo i file. Nel frattempo l'hero non ne ha bisogno:
`heroZoom` nel CSS dà 14 secondi di avvicinamento lento senza scaricare un
megabyte.

**La mappa non è di Google.** Sei riquadri di OpenStreetMap ospitati da noi:
si vede subito, nessun cookie, nessun consenso da cliccare.

---

## Documenti da leggere, in ordine di utilità

| File | A cosa serve |
|---|---|
| `DA-FORNIRE.md` | **Le cose che mancano dal cliente.** Il primo da aprire |
| `PROMPT-IMMAGINI.md` | Prompt pronti per immagini e video, impostazioni del tool, cosa manca |
| `MEDIA-E-ANIMAZIONI.md` | **Giudizio misurato su ogni immagine**, la deriva ambrata, i prompt di correzione, le proposte di animazione |
| `ALLERGENI-DA-COMPILARE.md` | 67 piatti × 14 allergeni, da far compilare in cucina |
| `DEPLOY.md` | Pubblicazione passo per passo |
| `MANUTENZIONE.md` | Come cambiare prezzi, orari, piatti senza toccare il codice |
| `ACCESSIBILITA.md` | Esito WCAG criterio per criterio |
| `design-system/x-sapori/MASTER.md` | Token, palette, regole visive |

---

## Cosa è stato verificato davvero

Tutto misurato nel browser sul rendering reale, non stimato.

- **Contrasti:** 143 elementi sulla home, 258 sul menu, 75 sulla prenotazione,
  71 sulla privacy, 31 sulla 404, 143 sulla home inglese. **Nessuno sotto
  soglia.**
- **Responsive** a 360, 390, 768, 1024, 1440 e in orizzontale su telefono:
  nessuno scroll orizzontale, nessun bersaglio sotto soglia fuori dalle
  eccezioni WCAG.
- **Prenotazione reale** dal browser → database → pannello: funziona.
  Validazione, honeypot, limite anti-spam, CSRF, CSV, cancellazione a due
  passi, SMTP Brevo.
- **File sensibili** in 403; intestazioni di sicurezza attive. Il 403 su
  `riferimenti/` è provato **su Apache**, non solo sull'anteprima — e ha due
  difese indipendenti, perché la prima versione non funzionava.
- **Immagini:** 39 URL fra `src` e `srcset` su nove pagine, nessuno rotto.
  Tutte hanno varianti responsive tranne i sei riquadri della mappa, che a
  256 px non ne hanno bisogno.
- **Scala tipografica:** un solo elemento reso fuori dai dieci gradini, ed è
  il rapporto `.6em` dentro il titolo dell'hero. Rapporto massimo fra
  gradini 1,54.
- **Confini fra sezioni:** nove su nove a **salto 0**, cioè il colore
  dell'ultimo pixel di una sezione è identico a quello del primo pixel della
  successiva.

**Non verificato:** l'ambiente di produzione, e **l'aspetto a schermo**. Il
pannello del browser in queste sessioni non dipinge, quindi gli screenshot non
funzionano e il caricamento pigro non scatta. Numeri sì, occhio no.

---

## I difetti trovati provando, non leggendo

Vale la pena conoscerli: nessuno si vedeva dai test automatici.

**Dalla prima tornata (agosto, prima del 21):**

1. `allowed_origins` non conteneva il dominio giusto: ogni prenotazione
   sarebbe stata rifiutata mentre il resto del sito funzionava.
2. Il campo trappola anti-bot si chiamava `indirizzo_web` e i gestori di
   password lo riempivano da soli: il cliente vedeva la conferma, la
   prenotazione spariva nel nulla.
3. Il flag `NE` mancante nei 301 trasformava `#la-sala` in `%23la-sala`.

**Da queste due sessioni:**

4. **Il dominio nella privacy era senza trattino** (`xsapori.it` invece di
   `x-sapori.it`): le richieste GDPR sarebbero rimbalzate in silenzio.
5. **La barra dei filtri del menu finiva sotto l'header fisso.** A 390 px la
   navigazione delle otto portate era coperta al 100%. Nasce `--header-h`.
6. **CSS e JS erano richiamati senza versione con `max-age` di 7 giorni:**
   dopo ogni pubblicazione chi era già passato riceveva HTML nuovo e CSS
   vecchio. Invisibile a curl e in finestra anonima.
7. **L'anteprima statica serviva `config.php` in chiaro** — password del
   database e credenziali SMTP — e ascoltava su tutte le interfacce di rete.
   Ora ascolta solo su `127.0.0.1` e blocca i file come `.htaccess`.
   **Le credenziali Brevo andrebbero cambiate per prudenza.**
8. **La coordinata nei dati strutturati era sbagliata di 887 metri.**
9. **L'inversione chiaro/scuro ha rotto dieci contrasti**, tutti da primitivi
   usati al posto dei semantici. Il peggiore: `.btn--ghost` non dichiarava
   sfondo e si appoggiava al grigio di sistema del browser — 1,04:1.

> **Morale:** le prove con `curl` non bastano, e nemmeno leggere il codice.
> Serve un browser vero, e serve misurare.

---

## Cosa manca per pubblicare

**Dal cliente, in ordine — i primi tre bloccano tutto:**

1. **Dominio definitivo** — ovunque c'è il segnaposto `www.x-sapori.it`,
   compreso `allowed_origins` in `config.php`
2. **Ragione sociale, P. IVA, provider di hosting, email privacy**
   (`privacy@x-sapori.it` va creata davvero)
3. **Regola bambini**: altezza o età? Ne può restare una sola
4. **Allergeni** compilati dalla cucina
5. **Undici piatti** con la cucina assegnata a occhio, da confermare
   (`DA-FORNIRE.md` §3-bis)

**Da fare comunque prima di pubblicare:**

- rigenerare `ip_salt` in `config.php` e togliere le righe `localhost` da
  `allowed_origins`
- alzare `?v=` su `styles.css` e `js/*.js` (vedi `DEPLOY.md` §4). **Oggi è a
  16**, ed è arrivato lì perché due volte, in una sola sessione, ho misurato
  il foglio di stile vecchio per essermelo dimenticato: se una modifica al
  CSS «non si vede», la prima cosa da controllare è questa.
- **tradurre i commenti russi** — vedi sotto

### Immagini e video ancora aperti

| | Stato |
|---|---|
| Foto per la card **Italia** | serve solo se si vogliono le foto nelle card: allora ne servono **quattro** |
| **Tavolo con molti piattini** | l'unica foto del piano che manca. Prompt pronto |
| **Video della carne girata** | l'unico che vale davvero, e richiede un generatore video |
| Dolci, vapore, rifacimenti | facoltativi |

### Traduzione dei commenti: prima della consegna

Nessun testo visibile al pubblico è in russo: sono commenti, e il sito
funziona identico. Ma chi manterrà il progetto non li legge.

> **Il numero che c'era qui era sbagliato, e vale la pena dire perché.**
> Diceva «circa 700 righe su otto file», contate con
> `grep -c '[а-яА-ЯёЁ]'`. Quel comando, in questa shell, considera cirillico
> anche `—`, `ì` e `«»`: contava cioè anche le righe **italiane** con un
> trattino lungo o una vocale accentata. Contate davvero, con
> `/[Ѐ-ӿ]/`, sono **412 righe su tre file** — e quattro degli otto
> file elencati non avevano **una sola** riga in russo.

| File | Righe | Stato |
|---|---|---|
| `api/notify.php` | 171 | da fare |
| `api/booking.php` | 157 | da fare |
| `schema.sql` | 84 | da fare |
| `config.example.php` | 0 | ✅ **tradotto il 25 agosto**, valori segnaposto compresi |
| `js/booking.js`, `js/prenota-plus.js`, `admin/index.php`, `js/site.js` | 0 | erano già in italiano |

`config.php` ne ha 80, ma è il file con le credenziali vere: sta fuori dal
repo e resta sul computer di chi sviluppa. Chi pubblica parte da
`config.example.php`, che ora è tutto in italiano.

---

## Cinque cose da sapere prima di toccare il codice

**1. I due registri sono entrambi espliciti.** `body, .on-dark, .hero,
.drawer, .site-footer` sono scuri; `:root, .cornice, .on-light` sono chiari.
Una superficie non può cambiare solo il fondo: deve ridefinire **tutti** i
semantici, `--sigillo` e `--success-text` compresi. È così che nascono i
contrasti rotti, ed è successo dieci volte in un giorno.

**2. Mai usare un primitivo in un componente.** `--inchiostro`, `--carta`,
`--ottone-30` funzionano su un tema solo, e il difetto si vede unicamente
sull'altro.

**3. Le classi usate da `js/booking.js`** — `.field--invalid`,
`.checkbox--invalid`, `.form-msg--error`, `.form-msg--ok`, `.field-error` —
sono un contratto: cambiarle scollega la validazione. Vale anche per
`.fascia`, che `js/prenota-plus.js:115` dà ai pulsanti delle fasce orarie:
**non è la fascia fotografica della home, che si chiama `.fascia-foto`.**
Quando avevano lo stesso nome, i pulsanti si prendevano l'altezza della
banda e diventavano undici colonne grigie alte 324 px.

**4. Una sezione scura non deve mai dichiarare un fondo pieno.** La pietra
è uno strato fisso dietro tutto (`body::before`): un colore opaco ci
dipinge sopra e la spegne in quel punto. Per l'elevazione si usa una
velatura sfumata ai bordi, come fa `.section--alt`.

**5. Se un componente è generato dal JavaScript, il suo posto nel layout
può non essere quello del markup.** Il campo orario sta in una griglia a
tre colonne — giusto per un `<input type="time">`, sbagliato per undici
pulsanti: `prenota-plus.js` lo sposta fuori dalla griglia proprio perché
quella scelta vale solo quando i pulsanti esistono davvero.

---

## Come riprendere in una conversazione nuova

Incolla questo:

> Riprendiamo il sito del ristorante X-Sapori in `D:\Claude Code\x-sapori`.
> Leggi `STATO-PROGETTO.md`, `DA-FORNIRE.md` e `PROMPT-IMMAGINI.md` per
> capire dove siamo. Il locale è un **buffet**: ci si serve al banco, non si
> ordina — se trovi testi che dicono il contrario sono vecchi.
> Prima di dichiarare qualcosa verificato, misuralo nel browser.
> [poi dici cosa vuoi fare]

Il resto si ricostruisce dai file e dalla storia git, che ha un commit
separato e commentato per ogni intervento: `git log --oneline` racconta il
progetto meglio di qualsiasi riassunto.
