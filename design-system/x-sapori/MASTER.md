# X-Sapori — Sistema di design (MASTER)

Fonte unica di verità. Se una pagina devia da qui, la deviazione va scritta in
`pages/<nome>.md` e motivata. Nessun colore o dimensione "sciolto" nel markup:
tutto passa dai token di `styles.css`.

## Direzione: "La sala"

Nata dalla fotografia reale del locale, non da un template. La sala ha pareti in
marmo grigio scuro, un soffitto attraversato da lamelle curve blu petrolio,
tavoli in marmo chiaro con profili in ottone, luce calda e bassa.

Tre conseguenze non negoziabili:

1. **Il petrolio è il colore delle azioni**, non l'oro. L'oro nella sala vera è
   solo un filetto sui bordi dei tavoli: nel sito resta filetto.

   > **Senza eccezioni — e per un giorno ce n'è stata una.** Il 25 agosto
   > 2026 il pulsante principale è diventato scuro (`--sala-70` →
   > `--sala-90`) per far risaltare l'anello di metallo. Guardato a schermo
   > il giorno dopo, era un tassello grigio con un alone iridato addosso:
   > **rimesso a petrolio**, `--petrolio-60` in alto e `--petrolio-80` in
   > basso, con l'anello di metallo che resta.
   >
   > **Perché il ragionamento di allora non reggeva.** Diceva: «il metallo si
   > vede come metallo solo se è la cosa più chiara del suo intorno». Vero,
   > ma l'intorno che conta è la cresta contro la faccia, non la faccia
   > contro la pagina: la cresta `#fbfdff` sta a luminanza 0,98 e il
   > petrolio a 0,18. Cinque volte. La cresta si stacca lo stesso, e il
   > pulsante resta di questo sito.
   >
   > Con la faccia accesa due manopole sono tornate indietro: la frangia
   > ambrata da `#d9a86a` a `#cdaa84` (l'arancio saturo contro il blu
   > leggeva come arcobaleno) e l'alone da 16 % a 12 %.
   >
   > L'etichetta torna **bianca**: 4,59:1 sul punto più sfavorevole della
   > faccia — `--petrolio-60`, in alto — e 9,32:1 in basso. Misurati sul
   > rendering reale. (Il riferimento usava `#666666` su nero, 3,66:1: non
   > sarebbe passato.)
2. **Lo scuro è il registro base, il chiaro è il tavolo.** *(Rovesciato il
   21 agosto 2026, guardando la fotografia ad alta risoluzione della sala:
   pareti in marmo quasi nero, lamelle retroilluminate, buffet come pozza di
   luce calda. Prima questo punto diceva l'opposto e il sito non somigliava
   al locale.)* Le superfici chiare sono riservate a dove si legge o si
   scrive a lungo — menu, prezzi, modulo, testi legali — perché nella sala
   vera il chiaro non è l'ambiente: è il piano del tavolo, col suo filetto
   d'ottone. Resta vero che un sito interamente scuro appiattisce la
   gerarchia dopo due schermate: le isole chiare e i tre livelli di
   elevazione (`sala-90/80/70`) esistono per impedirlo. Mai più di tre
   sezioni scure di fila senza un cambio di elevazione.
3. **Il filetto d'ottone è il motivo grafico ricorrente**: la testa della
   fascia fotografica, i passi della prenotazione, le quattro cucine sotto
   l'hero, il bordo del piede. Una riga di un pixel che si distende da
   sinistra. Sottile, mai decorativo e basta.

   > *(Fino al 24 agosto 2026 qui c'era scritto «l'arco è il motivo
   > ricorrente», e gli archi erano SVG e gradienti che ridisegnavano le
   > lamelle del soffitto. Sono stati tolti quando sono arrivate le
   > fotografie: sopra la sala vera, con le sue lamelle vere, erano due
   > soffitti sovrapposti, e coprivano il buffet illuminato in fondo. Restano
   > solo nei riquadri grafici `.plate`, dove non c'è nessuna fotografia
   > sotto da coprire — lì l'arco è il disegno, non una sovrastampa.)*

## Colore

| Token | Valore | Uso |
|---|---|---|
| `--marmo-00` | `#FBF9F5` | superficie principale chiara |
| `--marmo-10` | `#F3EFE8` | superficie alternata |
| `--marmo-20` | `#E7E1D6` | bordi, media in attesa |
| `--sala-90` | `#0E1417` | sezioni scure, hero, footer |
| `--sala-80` / `--sala-70` | `#171F24` / `#232E34` | superfici scure di secondo livello |
| `--petrolio-70` | `#17627A` | **azione primaria su chiaro** |
| `--petrolio-60` | `#1F7F9C` | hover, il colore del soffitto |
| `--petrolio-20` | `#8FD0E2` | accento e link su fondo scuro |
| `--ottone-50` | `#B98D4A` | **solo filetti, bordi, marchio** |
| `--ottone-70` | `#82632B` | oro come testo su fondo chiaro |
| `--ottone-30` | `#DCC38C` | oro come testo su fondo scuro |
| `--inchiostro` | `#14191C` | testo su chiaro |
| `--carta` | `#E7EDEF` | testo su scuro |

I nomi semantici (`--surface`, `--on-surface`, `--accent`, `--detail`, `--rule`)
sono l'unica cosa che i componenti possono usare.

**I due registri sono entrambi espliciti.** `body, .on-dark, .hero, .drawer,
.site-footer` ridefiniscono il blocco intero verso la sala; `:root, .cornice,
.on-light` lo ridefiniscono verso il tavolo. Nessuno dei due può cambiare solo
il fondo: ogni semantico va riscritto, `--sigillo` e `--success-text` compresi.
Chi aggiunge una superficie la aggiunge a uno dei due elenchi, mai per conto suo.

Token nati con l'inversione:

| Token | Chiaro | Scuro | Perché esiste |
|---|---|---|---|
| `--accent-fill` | `--petrolio-70` | `--petrolio-60` | il petrolio scuro come riempimento su fondo sala dà 2,71:1, sotto il 3:1 di WCAG 1.4.11 |
| `--surface-blur` | `rgba(251,249,245,.94)` | `rgba(14,20,23,.92)` | header e barra del menu sono traslucidi e devono seguire il registro |
| `--success-text` / `--error-text` | pieni | schiariti | verde e rosso di stato su fondo sala scendevano a 2,6:1 |
| `--header-h` | `4.25rem` | — | tre cose devono conoscerla: ancore, barra del menu, intestazioni |
| `--luce-calda` / `--luce-fredda` | — | — | **mai testo, mai fondo pieno**: solo gradienti e aloni |

### Contrasti verificati

| Coppia | Rapporto | Esito |
|---|---|---|
| `--inchiostro` su `--marmo-00` | 16,8:1 | AAA |
| `--on-surface-dim` (#5A6468) su `--marmo-00` | 5,8:1 | AA |
| `--petrolio-70` su `--marmo-00` | 6,5:1 | AA |
| bianco su `--petrolio-70` (bottone) | 6,9:1 | AA |
| `--carta` su `--sala-90` | 15,7:1 | AAA |
| `--ottone-30` su `--sala-90` | 10,8:1 | AAA |
| `--ottone-70` su `--marmo-10` | 4,86:1 | AA |
| `--ottone-50` su `--marmo-00` | 2,9:1 | **solo elementi non testuali** |
| `--petrolio-20` su `--sala-90` / `-80` / `-70` | 10,87 / 9,77 / 8,13:1 | AAA |
| `--carta` su `--sala-80` / `-70` | 14,12 / 11,75:1 | AAA |
| `--on-surface-dim` scuro su `--sala-80` / `-70` | 8,03 / 6,68:1 | AAA / AA |
| `--petrolio-60` come riempimento su `--sala-90` | 4,04:1 | AA non testuale |
| bianco su `--petrolio-60` | 4,59:1 | AA |
| `--ottone-50` (filetto del bottone) su `--sala-90` | 6,16:1 | percepibile sempre |
| `--success-text` scuro `#7FD1AC` su `--sala-80` | 9,24:1 | AAA |
| **`--petrolio-70` come testo o riempimento su `--sala-90`** | **2,71:1** | ❌ **da non usare mai**: è il motivo di `--accent-fill` |

Misurato nel browser sul rendering reale (non stimato) dopo l'inversione:
**148 elementi sulla home, 232 sul menu, 75 sulla prenotazione — nessuno sotto
soglia.** Lo stesso giro aveva trovato 6 regressioni sulla home e 4 sul menu,
tutte dovute a primitivi usati al posto dei semantici.

## Tipografia

| Ruolo | Font | Perché |
|---|---|---|
| Display | **Fraunces** (variabile, assi opsz + wght) | serif caldo con personalità. Bodoni Moda, usato prima, è il serif "ristorante di lusso" che usano tutti |
| Testo | **Familjen Grotesk** | grotesque leggibile, non anonimo |
| Dati | **DM Mono** | prezzi, orari, occhielli, etichette: linguaggio da comanda |

Self-hostati in `assets/fonts/`, sottoinsieme latino, **104 KB in tutto**.
Nessuna chiamata a Google Fonts: prestazioni e GDPR.

### Sostituire un font

Le tre famiglie sono nominate **solo** nei tre blocchi `@font-face` e nei tre
token `--font-display/body/data`: nessuna regola le chiama per nome. Cambiare
font significa sostituire un file `.woff2` e una riga.

Le regolazioni ottiche legate alle proporzioni del carattere sono token, non
letterali sparsi: `--track-display`, `--lh-tight`, `--wght-body/strong/display`.

Restano tre punti da ricontrollare a occhio con ogni famiglia nuova:

1. **`--lh-tight:1.05`** è molto stretta. Un display con ascendenti lunghe fa
   toccare le righe dei titoli su due o tre righe.
2. **`.hero__title em{font-size:.6em}`** è proporzionale al titolo: con un
   carattere di corpo ottico diverso il secondo verso cambia peso relativo.
3. **`font-synthesis-weight:none`** è voluto (niente grassetti finti), ma se la
   famiglia nuova non ha un 600 vero, tutti i `--wght-strong` scendono a 400
   **senza nessun errore visibile**. Controllare prima di sostituire.

Vincoli non negoziabili per i candidati: self-hostati in `assets/fonts/`,
sottoinsieme latino, nessuna chiamata esterna, peso complessivo paragonabile
ai 104 KB attuali.

Scala fluida: `--fs-display` → `--fs-micro`. Corpo del testo 17px, interlinea
1,62. Cifre tabulari su prezzi e orari, per non far ballare le colonne.

## Le fotografie: poche e grandi

Aggiunto il 23 agosto 2026, quando sono arrivate le prime immagini vere.

**Regola:** una fotografia sta dove può respirare, oppure non sta. Le foto
piccole dentro un riquadro da 270 px si leggono come stock e fanno sembrare
il sito assemblato; le stesse foto in grande lo fanno sembrare commissionato.

Conseguenza pratica: **le quattro card delle cucine restano grafiche.** Non è
una mancanza in attesa di essere colmata — è la scelta. Se un giorno si
vorranno le foto lì, ne servono quattro, Italia compresa: tre su quattro
lasciano una card diversa dalle altre, che è peggio di zero su quattro.

### Due componenti nuovi

**`.fascia`** — una fotografia a tutta larghezza, alta `clamp(240px,45vh,520px)`,
che esce dal contenitore e attraversa lo schermo. Serve a rompere il ritmo
delle sezioni a colonna. Ha le sfumature ai bordi che la cuciono alle sezioni
scure vicine e il filetto d'ottone in cima, come le isole chiare. È
decorativa: `aria-hidden` e `alt=""`.

**La pietra: una sola, ferma, a tutto schermo.** Il registro scuro non è
colore piatto: dietro c'è la texture del marmo della sala, sotto una velatura
all'88% fino a non leggersi più come immagine. Costa 72 KB, scaricati una
volta sola per tutto il sito.

Sta su **`body::before`**: `position:fixed`, `cover`, `no-repeat`, `z-index:-1`.
Un solo strato, immobile mentre la pagina scorre.

> **La regola che ne discende, ed è la più facile da rompere.** Le sezioni
> scure devono essere **translucide**. Se una dichiara un fondo pieno, ci
> dipinge sopra e la pietra si spegne lì: il sito torna a sembrare fogli
> accostati. Il fondo pieno lo prende **solo `body`** — e `.drawer`, che
> copre la pagina e deve essere opaco per forza.
>
> Per l'elevazione si usa una velatura che si apre e si chiude ai bordi
> (vedi `.section--alt`): l'occhio vede il cambio di piano, ma il confine
> non è un gradino e la pietra continua sotto.

*(Rifatto il 24 agosto 2026. Prima la texture era un `background-image` sul
blocco condiviso del registro scuro, con `background-size:1100px` e `repeat`.
Due difetti, tutti e due visibili solo a occhio: la piastrella si ripeteva e
la cucitura era una riga verticale netta — sembravano due immagini tagliate e
accostate — e la portavano solo `body` e `.on-dark`, mentre `.hero`,
`.section--alt`, `.page-head` e il piede ci dipingevano sopra un colore pieno,
quindi compariva a bande.)*

Le isole chiare non la ereditano: restano piene, perché sotto sessanta righe
di menu un fondo semitrasparente è illeggibile. La morbidezza ai loro bordi
la fanno l'alone caldo e sedici pixel di raccordo.

**In stampa la pietra sparisce**, insieme a tutte le velature di raccordo: è
`fixed`, e in stampa un fondo fisso si ripete foglio per foglio.

### Nessun confine fra sezioni deve essere un gradino

La regola operativa, e si può verificare con un numero: **il colore composito
dell'ultimo pixel di una sezione deve essere uguale a quello del primo pixel
della sezione dopo.** Se lo è, il bordo non esiste. Misurato sui nove confini
della home, il salto massimo deve restare **0**.

Se ne ricavano due modi, uno per registro:

- **Fra sezioni scure**, il fondo si apre e si chiude a **`alpha 0`**: al
  confine restano tutte e due la pietra. Lo fanno `.section--alt`,
  `.page-head`, `.cta-band` e il piede.
- **Fra scuro e chiaro** non si può usare la trasparenza — l'isola chiara
  deve restare piena dove si legge — quindi il raccordo è una **rampa dentro
  l'isola**, che parte dal colore esatto della pietra e va a zero in metà del
  padding della sezione. Il testo resta sempre oltre la rampa perché la
  rampa è legata al padding, non a un valore fisso.

> **La trappola, e ci sono cascato.** Una velatura sopra una fotografia deve
> diventare **sempre più coprente** verso il bordo, non sempre meno. L'hero
> chiudeva in `transparent`: gli ultimi pixel dell'immagine tornavano a piena
> luce proprio sul confine, e il taglio fra hero e sezione seguente era la
> riga più visibile del sito. Ora chiude su `--sala-90` pieno.

> Nella sala vera le pareti sono pietra. Il sito lo diventa anche dove non
> c'è una fotografia: è quello che tiene insieme il tutto quando le immagini
> finiscono.

### L'hero non ha bisogno di un video

Nel CSS c'è `heroZoom`: 14 secondi di avvicinamento lentissimo, poi si ferma.
Con una fotografia vera dà quello che darebbe un video di sfondo, senza
scaricare un megabyte e senza il pulsante di pausa che WCAG 2.2.2 imporrebbe.
Quando arriverà il video prenderà il posto di questa animazione, senza toccare
il layout.

## Spazio e forma

Scala `--sp-1` (0,35rem) → `--sp-8` (8,5rem). Contenitore 1280px, versione
stretta 820px per il testo lungo. Raggi piccoli (2/4/10px) e pillola solo sui
bottoni. Tre ombre soltanto.

## Movimento

| Token | Valore | Uso |
|---|---|---|
| `--dur-fast` | 180ms | hover, pressione, cambi di stato |
| `--dur-mid` | 380ms | header, pannelli, accordion |
| `--dur-slow` | 820ms | comparsa delle sezioni allo scroll |
| `--ease-out` | `cubic-bezier(.16,.84,.44,1)` | ingressi |
| `--ease-soft` | `cubic-bezier(.33,1,.68,1)` | movimenti lunghi |

Regole: si animano solo `transform` e `opacity`; sfasamento 80-120ms fra
elementi di una serie; l'hero entra in sequenza (occhiello → titolo → testo →
bottoni → dati); `prefers-reduced-motion` disattiva tutto e lascia il
contenuto visibile.

**Il gesto ricorrente è il filetto che si distende**: `transform:scaleX(0)` →
`scaleX(1)` con origine a sinistra. Lo fanno la testa della fascia
fotografica, il sottotitolo dei passi della prenotazione e le quattro cucine.
Mai `width`: sarebbe un ricalcolo del layout a ogni fotogramma.

**Le sezioni partono nascoste solo se il JavaScript è attivo** (classe `.js` sul
tag `html`). Senza JavaScript il sito resta completo e leggibile. Se
l'IntersectionObserver non risponde entro 1,2 secondi, tutto viene mostrato lo
stesso: nessuna pagina può restare bianca.

## Lezione imparata sul campo

Una superficie scura che cambia **solo** la proprietà `color` lascia i
componenti interni con i token del tema chiaro. Nel primo giro l'hero faceva
esattamente questo e il pulsante «Sfoglia il menu» era inchiostro su fondo
quasi nero: **1,05:1**, invisibile. Ora `.on-dark`, `.hero`, `.drawer` e
`.site-footer` condividono lo stesso blocco di token semantici. Ogni nuova
superficie scura va aggiunta a quell'elenco, mai definita per conto suo.

Corollario: quando si aggiunge un componente, i colori si prendono **sempre**
dai token semantici (`--on-surface`, `--accent`, `--rule`). Un colore preso da
un primitivo (`--inchiostro`, `--carta`) funziona su un tema solo, e il difetto
si vede unicamente sull'altro.

## Regole che non si violano

- Nessuna emoji come icona: solo SVG, tratto 1,6-1,8px, una sola famiglia.
- Una sola azione primaria per schermata.
- I bersagli tattili stanno sopra i 44px; i link in elenco sopra i 24px anche
  quando sono testo.
- Ogni immagine dichiara `width` e `height`: nessuno spostamento al caricamento.
- I nomi delle classi usate da `js/booking.js` (`.field--invalid`,
  `.checkbox--invalid`, `.form-msg--error`, `.form-msg--ok`, `.field-error`)
  sono un contratto: cambiarli scollega la validazione.
