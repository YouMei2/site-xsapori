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

**Se una modifica al CSS non si vede, alza `?v=`.** Oggi è a **42**, ed è
arrivato lì perché è successo più volte di misurare il foglio di stile
vecchio. Sono nove file HTML più la pagina inglese: alzalo dappertutto.

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

## Il pulsante di metallo, chiuso il 25 agosto 2026

Era la cosa aperta della sessione precedente. **Adesso è finito e approvato
guardandolo**, non misurandolo — ed è tutta la differenza, perché per due
giorni le misure hanno detto che funzionava mentre non si muoveva affatto.

**Com'è fatto.** Faccia **petrolio** (`--petrolio-60` → `--petrolio-80`),
etichetta bianca, e intorno un anello di 2 px di metallo attraversato da una
fascia di luce che scorre. Cerca «ANELLO DI METALLO» in `styles.css`: sopra
ogni numero c'è scritto perché è quel numero.

**Le manopole sono quattro**, e sono tutte in cima al blocco:

| | |
|---|---|
| `--periodo` | 190 px, quanto è distante la sorgente di luce |
| durata | 5 s l'anello, 7,5 s l'alone — il rapporto 3:2 li tiene fuori fase |
| picco | `#AEBEC8`, 0,506 di luminanza |
| spessore | 2 px, l'unico parametro scelto a occhio |

**Il numero da non superare è 0,18**, la luminanza della faccia azzurra.
Finché la mediana del perimetro resta sotto, l'anello è uno spigolo in ombra
intorno a una superficie accesa; appena la supera diventa un contorno chiaro
disegnato addosso al pulsante, che è il difetto della primissima versione.
Oggi la mediana sta fra 0,077 e 0,132 in ogni fase del ciclo. **Guarda quel
numero, non il picco.**

### Quattro cose imparate qui che valgono per tutto il foglio

**1. `var()` dentro una custom property si risolve dove la property è
DICHIARATA.** `--metallo` stava su `:root`, e lì la posizione veniva
risolta a zero: ai pseudo-elementi scendeva per eredità una stringa già
finita. L'animazione girava davvero e nessuno la leggeva. **È il motivo per
cui l'anello non si è mai mosso, nemmeno l'effetto hover scritto due giorni
prima** — che era stato «verificato» misurando la proprietà invece del
dipinto.

**2. Lo shorthand `background` azzera `background-size` e
`background-position`.** Stando più in basso vinceva in silenzio: la
dimensione risultava `auto` e la posizione `0% 0%` a ogni istante. Quarto
inciampo di questo tipo. La cura è `background-image`.

**3. Un'`animation` vince sempre su una `transition` della stessa
proprietà.** Per avere insieme lo scorrimento continuo e lo scatto al
passaggio del mouse servono **due** proprietà che si sommano. E cambiare la
*durata* all'hover non è un'alternativa: il browser rimappa il tempo già
trascorso sulla durata nuova, e il motivo salta.

**4. Quello che si vede muoversi è il contrasto NEL TEMPO, non nello
spazio.** È l'errore che è costato di più. Misuravo quanto è chiara la
cresta rispetto al resto dell'anello a un istante fermo, e i numeri erano
ottimi. Ma con il ciclo a 14 secondi ogni fase restava ferma tre secondi e
mezzo su una riga alta 2 px: è stato riferito come «non si muove più»
mentre la misura diceva che andava tutto bene. **Se animi qualcosa, misura
quanto cambia un punto fisso al secondo.**

> **E una cosa da non rifare.** Avevo scritto
> `@supports not (at-rule(@property))` come ripiego. È sostenuto solo da
> Chrome 133 in poi: più indietro la condizione risulta ignota, quindi
> falsa, quindi `not` la ribalta a **vera** — e il ripiego si sarebbe acceso
> esattamente nei browser dove l'effetto funziona. Un `@supports` che testa
> una feature con una sintassi più recente della feature stessa è una
> trappola.
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

- **rendersi da soli il componente fuori schermo** e aprirlo: ridisegnare in
  un `OffscreenCanvas` quello che il CSS dovrebbe dipingere — il gradiente,
  la maschera, la faccia sopra — a quattro istanti diversi del ciclo, e
  guardare il PNG. È così che ho scoperto che c'era una fase in cui il
  pulsante era completamente liscio: nessuna misura me l'aveva detto, e
  bastava guardarlo;
- **decodificare un GIF fotogramma per fotogramma** con `ImageDecoder`, che
  è il modo di guardare una registrazione fatta dall'utente. È così che il
  25 agosto ho confrontato il pulsante vero con il componente di
  riferimento, e ho misurato la luminanza lungo il suo perimetro.

**Quello che resta impossibile:** giudicare se una cosa è bella. Gli
screenshot annotati dell'utente hanno trovato **nove difetti** che nessuna
misura aveva visto — e il 25 agosto altri quattro, tutti sul pulsante.

**E una cosa che credevo possibile e non lo è: dichiarare che un'animazione
funziona.** Il pannello non compone fotogrammi, quindi `requestAnimationFrame`
non scatta, gli screenshot vanno in timeout e **`IntersectionObserver` non
consegna una sola callback** — provato, zero. Si può misurare che una
proprietà avanza; che si veda muovere, no.

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
- **Il pulsante di metallo**, il 25 agosto: mediana del perimetro fra 0,077
  e 0,132 su sei fasi del ciclo, sempre sotto la faccia; nessuna fase spenta;
  bianco sull'azzurro a 4,59:1 nel punto peggiore. E, per la prima volta,
  **guardato**: reso fuori schermo a quattro istanti e approvato a occhio.

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
- ~~sistemare i testi inglesi che facevano ancora ordinare~~ **fatto il 25
  agosto**: sei righe in `/en/`, che l'italiano non aveva
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
