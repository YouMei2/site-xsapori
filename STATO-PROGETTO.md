# Stato del progetto — 25 agosto 2026

Documento di passaggio: serve a riprendere il lavoro in una conversazione
nuova, o a farlo riprendere a un'altra persona, senza rileggere niente.

---

## Che cos'è

Sito di **X-Sapori**, gran buffet all you can eat in Via Luigi Pirandello 2r,
Savona. Tel. 019 221 3138, aperto 7/7, 12:00–15:00 e 19:00–23:00.

**Come funziona il locale.** È un **buffet**: ci si serve da soli al banco,
non si ordina, non c'è un cameriere che prende le comande. Ogni tanto il
personale passa fra i tavoli con qualcosa che al banco non c'è — carne
girata alla brace, ananas, un dolce — ma non è fisso e non va promesso come
un servizio. **Se trovi un testo che dice il contrario è vecchio**: ne sono
saltati fuori quattro anche il 25 agosto, dentro `site.webmanifest` e nelle
card delle cucine.

**Stack:** HTML statico + CSS + JavaScript vanilla + PHP 8.1 + MySQL.
Nessun framework, nessuna dipendenza npm. Deve poter essere caricato via FTP
su hosting condiviso. *(È un vincolo vero: il 25 agosto è arrivata la
richiesta di integrare un componente React con shader WebGL, e non era
installabile — l'effetto è stato rifatto in CSS puro.)*

**Cartelle:**
- `D:\Claude Code\x-sapori` — il progetto vero, sotto git
- `C:\xampp\htdocs\x-sapori` — copia di prova locale (ha una password admin
  usa-e-getta e `RewriteBase` in più: **non è quella da pubblicare**)

---

## Per provare: un indirizzo solo

**`http://localhost:4173`**, e basta quello. È l'anteprima in Node
(`.dev-server.js`), che serve i file statici e **inoltra `/api/` e `/admin/`
ad Apache** sulla 8080. PHP e database sono quelli veri, quindi da lì si
prenota davvero.

XAMPP va comunque acceso a mano dal suo pannello — Apache e MySQL non sono
servizi — perché l'inoltro sposta la richiesta, non sostituisce il server. Se
è spento, il modulo lo dice e spiega cosa avviare.

> **Attenzione, è la cosa che confonde di più.** Apache serve la **copia** in
> `C:\xampp\htdocs\x-sapori`, non la cartella del progetto. Il PHP che gira è
> quello lì. Se tocchi `api/` o `config.php`, **ricopiali**, altrimenti la
> modifica «non fa effetto».

**Se una modifica al CSS non si vede, alza `?v=`.** Oggi è a **26**, ed è
arrivato lì perché è successo tre volte in due giorni di misurare il foglio
di stile vecchio.

---

## Com'è fatto

**Tre pagine** più privacy e 404, e la versione inglese completa in `/en/`.

**Direzione visiva «La sala»**, ricavata dalla fotografia reale del locale.
Scuro = la sala, chiaro = il tavolo. Tutto in
`design-system/x-sapori/MASTER.md`, che è la fonte di verità.

**Dietro tutto c'è la pietra**: la texture del marmo a velatura 88%, uno
strato solo, fisso, a tutto schermo (`body::before`).

> **La regola più facile da rompere: le sezioni scure devono essere
> translucide.** Se una dichiara un fondo pieno, ci dipinge sopra e la pietra
> si spegne lì. Il fondo pieno lo prende solo `body` — e `.drawer`, che copre
> la pagina.

**Nessun confine fra sezioni è un gradino.** Il colore dell'ultimo pixel di
una sezione è identico a quello del primo pixel della successiva: nove
confini su nove a **salto 0**, misurato. Fra sezioni scure il fondo si apre e
si chiude ad alpha 0; fra scuro e chiaro c'è una rampa dentro l'isola chiara.

**Le fotografie ci sono**: tredici WebP, con **ventuno varianti responsive**
e `srcset` su tutte. La home è passata da 1446 a 808 KB di immagini.

**Nessun video esiste**, ma l'impianto sì: `js/site.js:65` costruisce il
`<video>` appena `.hero__bg` dichiara `data-video`.

**La mappa non è di Google**: sei riquadri di OpenStreetMap auto-ospitati.

---

## ⚠️ La cosa aperta adesso: il pulsante di metallo

**Non è finito, e l'ultima parola è dell'occhio, non della misura.**

Richiesta: riprodurre un pulsante «liquid metal» visto in un componente
React con shader WebGL. Rifatto in CSS puro — `conic-gradient` ritagliato ad
anello da una maschera, animato con `@property`.

**Dove sta adesso** (`styles.css`, cerca «ANELLO DI METALLO»):
- faccia scura `--sala-70` → `--sala-90`, etichetta `#8B979D`
- anello 1,5 px, quattro creste strette con valli quasi nere, `from 45deg`
- alone: stesso gradiente mascherato ad anello, sfocatura 3 px al 16%

**Le tre correzioni già fatte, per non ripeterle:**
1. Il petrolio acceso sotto uccideva l'effetto: il metallo si vede solo se è
   la cosa più chiara dell'intorno. Per questo la faccia è scura.
2. Otto creste mezze accese sembravano un filo di luce. Sono quattro, con
   valli a `#151b20`.
3. L'alone era una pillola **piena** sfocata: il chiaro si spandeva su tutto
   il perimetro e sembrava un tubo al neon. Ora è un anello anche lui.

**Cosa resta da giudicare:** l'ultimo screenshot mostrava ancora un anello
troppo acceso. La correzione dell'alone è successiva e **non è stata
verificata a occhio da nessuno**.

> **Se serve regolarlo**, le manopole sono tre e stanno tutte in
> `styles.css`: l'opacità e la sfocatura di `.btn--primary::after`, la
> larghezza delle creste nel gradiente `--metallo`, e lo spessore
> dell'anello (`inset` e `padding` di `.btn--primary::before`).

**Questo cambio è costato una regola del sistema.** `MASTER.md` diceva «il
petrolio è il colore delle azioni». Ora il petrolio resta il colore dei link,
dei bordi, degli stati e del pulsante fantasma: cambia solo l'azione
principale. È scritto lì con il motivo.

---

## Come guardare qualcosa, visto che il pannello non dipinge

**Questo è il metodo più utile scoperto in due giorni, e va conservato.**

Il pannello del browser di queste sessioni **non compone frame**: niente
screenshot, il caricamento pigro non scatta, le transizioni non avanzano.
Per due giorni ho solo misurato, mai visto.

Si può aggirare:
- **leggere i pixel** con `createImageBitmap` + `OffscreenCanvas` (funziona
  sempre; `img.decode()` invece a volte si impunta);
- **guardare le immagini** salvandole su disco e aprendole con lo strumento
  di lettura file — è così che ho confrontato i due video;
- **estrarre fotogrammi da un video** senza ffmpeg: `<video>` su canvas,
  canvas in PNG, PNG scritto da un endpoint `POST` temporaneo aggiunto a
  `.dev-server.js` e tolto subito dopo;
- **misurare lo stato finale di un'animazione** iniettando
  `*{transition:none!important}` e rileggendo lo stile calcolato.

**Quello che resta impossibile:** giudicare se una cosa è bella. Gli
screenshot annotati dell'utente hanno trovato **nove difetti** che nessuna
misura aveva visto.

---

## Cosa è stato verificato davvero

Tutto misurato nel browser sul rendering reale.

- **Contrasti** su nove pagine, calcolando la **composizione reale degli
  strati** e non il primo colore opaco: minimo **4,64:1**, nessuno sotto
  soglia. Va rifatto a ogni cambio di dimensioni o di fondo — è così che si
  scoprono i difetti, tre volte in due giorni.
- **Scala tipografica:** un solo elemento fuori dai dieci gradini, ed è un
  rapporto voluto. Rapporto massimo 1,54.
- **Confini fra sezioni:** nove su nove a salto 0.
- **Immagini:** 39 URL fra `src` e `srcset`, nessuno rotto; nessuna più
  ingrandita, nessuna consegnata al triplo.
- **Prenotazione reale** dal browser sulla 4173 → PHP → database → pannello.
- **File sensibili** in 403, provato **su Apache** e con i traversamenti.
- **Responsive** a 360, 390, 1024, 1440, 1920: nessuno scroll orizzontale,
  nessun bersaglio sotto i 44 px.

---

## Cosa manca per pubblicare

**Dal cliente — i primi tre bloccano tutto:**

1. **Dominio definitivo** — ovunque c'è `www.x-sapori.it`, compreso
   `allowed_origins` in `config.php`
2. **Ragione sociale, P. IVA, provider di hosting, email privacy**
   (`privacy@x-sapori.it` va creata davvero)
3. **Regola bambini**: altezza o età? Ne può restare una sola
4. **Allergeni** compilati dalla cucina (`ALLERGENI-DA-COMPILARE.md`)
5. **Undici piatti** con la cucina assegnata a occhio (`DA-FORNIRE.md` §3-bis)

**Da fare comunque prima:**

- rigenerare `ip_salt` e togliere le righe `localhost` da `allowed_origins`
- alzare `?v=` un'ultima volta
- **tradurre i commenti russi**: restano **412 righe su tre file** —
  `api/notify.php` 171, `api/booking.php` 157, `schema.sql` 84.
  `config.example.php` è già fatto, valori segnaposto compresi.
  *(Il numero che girava prima, «700 righe su otto file», era sbagliato:
  `grep -c '[а-яА-ЯёЁ]'` in questa shell conta come cirillico anche `—`, `ì`
  e `«»`, cioè le righe italiane. Contare con `/[Ѐ-ӿ]/`.)*

**Immagini e video ancora aperti:**

| | Stato |
|---|---|
| **L'hero è ambrato** dove la sala vera è petrolio | 13,8% contro 40,1% di petrolio. Prompt di correzione e criterio numerico pronti in `MEDIA-E-ANIMAZIONI.md` |
| **Tavolo con molti piattini** | l'unica foto che mostra il *risultato* del buffet. Prompt pronto |
| **Video della carne girata** | l'unico che vale, richiede un generatore |

> Se rigeneri un'immagine, **rigenera anche le sue varianti**, o il sito
> serve la foto nuova sugli schermi grandi e quella vecchia su tutti gli
> altri. Il metodo è nel commit `b18e9ec`.

---

## Sei cose da sapere prima di toccare il codice

**1. I due registri sono entrambi espliciti.** Una superficie non può
cambiare solo il fondo: deve ridefinire **tutti** i semantici. È così che
nascono i contrasti rotti.

**2. Mai un primitivo in un componente**, e **mai `--accent` dove va
`--accent-fill`**: il primo è il colore di un *link*, il secondo il
*riempimento* di un pulsante. Confonderli è costato un 1,39:1.

**3. Le classi usate dal JavaScript sono un contratto**: `.field--invalid`,
`.form-msg--error`, `.field-error`, e `.fascia` — che è il pulsante della
fascia oraria, **non** la fascia fotografica, che si chiama `.fascia-foto`.
Quando avevano lo stesso nome, i pulsanti diventavano colonne alte 324 px.

**4. Una sezione scura non deve mai dichiarare un fondo pieno.**

**5. Se un componente è generato dal JavaScript, il suo posto nel layout può
non essere quello del markup.** Il campo orario esce dalla griglia a tre
colonne perché undici pulsanti in un terzo di colonna si incolonnano.

**6. A parità di specificità vince chi sta più in basso, e perde in
silenzio.** È successo tre volte: `.stima--doppione` sotto `.stima`,
`.btn:active` sotto `.btn--primary:active`, `.form fieldset` sopra `.passo`.
**Se una regola «non funziona», controlla prima l'ordine.**

---

## Come riprendere in una conversazione nuova

Incolla questo:

> Riprendiamo il sito del ristorante X-Sapori in `D:\Claude Code\x-sapori`.
> Leggi `STATO-PROGETTO.md`, `DA-FORNIRE.md` e `MEDIA-E-ANIMAZIONI.md` per
> capire dove siamo. Il locale è un **buffet**: ci si serve al banco, non si
> ordina — se trovi testi che dicono il contrario sono vecchi.
> Prima di dichiarare qualcosa verificato, misuralo nel browser — e se
> riguarda l'aspetto, chiedimi uno screenshot invece di fidarti dei numeri.
> [poi dici cosa vuoi fare]

Il resto si ricostruisce dai file e da `git log --oneline`, che ha un commit
separato e commentato per ogni intervento e racconta il progetto meglio di
qualsiasi riassunto.
