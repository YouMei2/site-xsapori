# Media e animazioni — giudizio, prompt, proposte

24 agosto 2026. Nasce dal prompt «Media e animazioni X-Sapori», eseguito nei
suoi cinque passi. Il metro di paragone è `riferimenti/sala-x-sapori-originale.webp`,
la fotografia vera del locale.

**Come sono stati ottenuti i numeri.** Il pannello del browser di questa
sessione non compone frame: niente screenshot, e il caricamento pigro non
scatta. Ho aggirato il limite leggendo i pixel con `createImageBitmap` e
`OffscreenCanvas`, campionando ogni immagine a 96–120 px di larghezza e
classificando ogni pixel per famiglia di tinta e luminanza. Tutti i numeri
qui dentro sono misurati. **Quello che non c'è è il giudizio a occhio**: se
un'immagine «sembra generata» non posso dirlo, e dove il criterio richiede
l'occhio lo scrivo invece di inventare una risposta.

---

## Quattro premesse del prompt che erano false

Corrette prima di iniziare, perché portavano il lavoro fuori strada.

1. **«L'hero è già predisposto per il video» — l'impianto sì, i file no.**
   `js/site.js:65` costruisce il `<video>` appena `.hero__bg` dichiara
   `data-video`: muto, in loop, poster, pulsante di pausa WCAG 2.2.2, blocco
   su rete lenta. Ma **non esiste nessun `.webm` né `.mp4`** nel progetto.
   `STATO-PROGETTO.md` affermava il contrario ed è stato corretto.
2. **«Queste 8 immagini» — sono 12 generate e 14 in uso**, più i 6 riquadri
   della mappa.
3. **«Prodotte con ElevenLabs e Kling» — no: GPT Image 2 e Seedance 2.5**,
   con le impostazioni documentate in `PROMPT-IMMAGINI.md §1`. I prompt qui
   sotto sono scritti per quei due strumenti.
4. **«Cerca `<video>` e `<source>` nell'HTML» — non ce ne sono e non ce ne
   saranno**: il tag lo inietta il JS. Un censimento fatto solo col grep
   conclude che il sito non prevede video, cioè il contrario del vero.

E una precisazione: **non ho nessun MCP di generazione collegato.** Adobe e
Canva sono strumenti di editing e composizione — ritaglio, colore, sfocatura,
rimozione sfondo, rendering di layout. Le uniche funzioni vagamente
generative (`image_generative_expand`, `image_fill_area`) allargano o
riparano un'immagine esistente, non ne creano una. Quindi qui trovi **solo
prompt**, da incollare tu.

---

# Passo 1 — Censimento

## In uso: 14 file, 20 riferimenti

### Home (registro scuro)

| File | Dove | Nativo | Reso | Trattamento |
|---|---|---|---|---|
| `sala.webp` / `sala-1440.webp` | hero | 2880×1620 / 1440×810 | 1359×804 | `srcset` 2 sorgenti, `cover`, `heroZoom` 14 s |
| `banco.webp` | «Come funziona» | 1600×1000 | 565×353 | `.plate--wide`, `cover` |
| `carne-girata.webp` | «Come funziona» | 1600×1000 | 565×353 | `.plate--wide`, `cover` |
| `banco-atmosfera.webp` | fascia a tutta larghezza | 1600×1000 | 1270×324 | `cover`, `object-position:center 55%`, sfumature ai bordi, `aria-hidden` |
| `sedia-tavolo.webp` | «La sala» | 1024×640 | 547×342 | `.plate--wide`, `cover` |
| `banco-sushi.webp` | «La sala» | 1600×1000 | 565×353 | `.plate--wide`, `cover` |
| `mani-salmone.webp` | «La sala» | 1152×720 | 565×353 | `.plate--wide`, `cover` |
| `mappa/*.png` ×6 | «Dove siamo» | 256×256 | 182×182 | `fill`, OpenStreetMap auto-ospitato |

### Menu (registro chiaro, fondo `#FBF9F5`)

Tutte con `.menu-foto`: `aspect-ratio:4/3`, `cover`, bordo 1 px `--ottone-50`.

| File | Nativo | Reso | Taglio |
|---|---|---|---|
| `piatto-vuoto.webp` | 1152×720 | 1158×506 | 30 % (`--larga`, 16:7) |
| `vapore.webp` | 960×720 | 256×192 | **0 %** |
| `nigiri.webp` | 800×1000 | 256×192 | 40 % |
| `salsa-soia.webp` | 960×720 | 256×192 | **0 %** |

### Altro

- **CSS**: `marmo-scuro.webp` (1280×720) in `styles.css:239`, texture di fondo
  a velatura 90 %.
- **`/en/`**: gli stessi 14 file via `../uploads/`, con `alt` propri. **Ogni
  sostituzione tocca due file.**
- **Video**: zero.
- **Placeholder dichiarati**: nessuno. Le quattro card delle cucine sono
  tavole grafiche CSS **per scelta documentata**, non segnaposto vuoti.

## Materiale interno che finiva pubblicato

`sala-x-sapori-originale.webp` (20 KB) e `riferimento-sito-esterno.png`
(40 KB) stavano in `uploads/`: non usati da nessuna pagina, ma caricati via
FTP e serviti dal web. **Spostati in `riferimenti/`**, che `.htaccess` nega
con un 403 e che il server di anteprima ora blocca allo stesso modo.

**E la prima versione di quel 403 non funzionava.** Vale la pena raccontarlo,
perché è lo stesso errore di sempre. La regola era
`RedirectMatch 403 (?i)^/riferimenti(/|$)`, verificata sul server di anteprima,
dove passava. Provata poi su Apache vero, i file rispondevano **200**:
`RedirectMatch` confronta il percorso a partire dalla radice del **server**,
non dalla cartella che contiene il `.htaccess`. Con il sito in una
sottocartella il percorso è `/x-sapori/riferimenti/…`, e `^/riferimenti` non
aggancia niente.

Corretta in `(^|/)riferimenti(/|$)`, che funziona in tutti e due i casi.
Aggiunta anche una **seconda difesa indipendente**: `riferimenti/.htaccess`
con `Require all denied`, che vale per la cartella dovunque venga spostata e
non dipende dal file di radice. Provate una alla volta su Apache disattivando
l'altra: reggono entrambe da sole. E un file *chiamato*
`riferimenti-di-prova.webp` resta accessibile — la regola aggancia il segmento
di percorso, non il prefisso del nome.

---

# Passo 2 — Giudizio su ogni immagine

## La deriva ambrata: il risultato più importante

Ho campionato ogni immagine e classificato i pixel per famiglia di tinta
(ambra 20–55°, petrolio 170–215°, neutro sotto il 10 % di saturazione).

| | Luminanza | Petrolio | Ambra | Neutro |
|---|---|---|---|---|
| **`sala-x-sapori-originale`** (riferimento) | **0,386** | **40,1 %** | 19,8 % | 32,9 % |
| `sala-1440` (hero) | 0,177 | 13,8 % | **72,5 %** | 9,0 % |
| `banco` | 0,203 | 6,8 % | 82,0 % | 6,1 % |
| `banco-atmosfera` | 0,175 | 10,8 % | 80,7 % | 5,9 % |
| `banco-sushi` | 0,188 | 6,5 % | 73,6 % | 7,8 % |
| `carne-girata` | 0,219 | 7,2 % | 56,3 % | 8,5 % |
| `mani-salmone` | 0,146 | 6,6 % | 47,5 % | 20,9 % |
| `sedia-tavolo` | 0,237 | **48,9 %** | 9,8 % | 37,3 % |
| `vapore` | 0,146 | **47,1 %** | 6,4 % | 38,7 % |
| `nigiri` | 0,213 | 0,2 % | 4,4 % | 43,9 % |
| `salsa-soia` | 0,133 | 0,1 % | 38,7 % | 39,5 % |
| `piatto-vuoto` | 0,832 | 0 % | 83,6 % | 2,5 % |
| `marmo-scuro` (texture) | 0,119 | 18,1 % | 0 % | 60,2 % |

**La sala vera è petrolio-dominante. Le immagini del banco sono
ambra-dominanti e scure la metà.**

Va letto con onestà. Per un primo piano del bancone una parte dello scarto è
**legittima**: un banco illuminato a caldo *è* ambra, e il riferimento è una
ripresa larga che include tutto il soffitto blu. Il confronto pulito è
**hero contro riferimento**, perché sono la stessa inquadratura: 72,5 %
contro 19,8 % di ambra, 13,8 % contro 40,1 % di petrolio, e metà della
luminanza. Lì la differenza non si spiega con il soggetto.

Due limiti del metro: il riferimento è di soli **300×225 px**, e il suo
bilanciamento del bianco non è verificabile. È il metro migliore che c'è,
non un metro perfetto.

`sedia-tavolo` e `vapore` invece centrano la palette vera. Non è un caso: sono
le uniche due che non vengono dalla tornata del banco.

## Promosse così come sono — nove

Nessun lavoro dove non serve.

- **`banco-atmosfera`** — il ritaglio attuale (`center 55%`) è a 4 punti
  dall'ottimo calcolato (59 %): la differenza vale 19 px su 794. Decorativa e
  `aria-hidden`, coperta dalle sfumature ai bordi. Il 59 % di altezza tagliato
  è la natura di una fascia, non un difetto: il 30 % superiore dell'immagine è
  nero morto e sarebbe stato scartato comunque.
- **`vapore`** e **`salsa-soia`** — 960×720 in un riquadro 4:3: **taglio zero**.
  `vapore` è anche fra le due che centrano la palette.
- **`piatto-vuoto`** — luminanza 0,832 in una sezione a fondo 0,98. È l'unica
  immagine chiara del gruppo ed è nell'unico registro chiaro del sito:
  collocazione giusta.
- **`sedia-tavolo`** — la più fedele di tutte: petrolio 48,9 %, neutro 37,3 %.
- **`banco-sushi`**, **`mani-salmone`**, **`banco`**, **`marmo-scuro`** — al
  netto della deriva ambrata di cui sopra, stanno nel posto giusto e nel
  registro giusto.

## Corrette in questa sessione — quattro

**1. La fascia fotografica della home ereditava lo stile dei pulsanti della
prenotazione.** La classe `.fascia` era usata per due cose diverse: la
fotografia a tutta larghezza (`styles.css:615`) e i pulsanti delle fasce
orarie che `js/prenota-plus.js:115` genera (`styles.css:1085`, più in basso e
quindi vincenti). Misurato sul rendering reale, la fotografia decorativa
aveva addosso `border:0.8px solid rgba(231,237,239,.3)`, `border-radius:4px`,
`padding:8px 12.8px`, `cursor:pointer`, il cambio di bordo al passaggio del
mouse e lo scatto di 1 px al clic — su un elemento `aria-hidden`.

Rinominata in **`.fascia-foto`** (HTML: `index.html`, `en/index.html`; CSS:
il blocco 615–634). Il nome dei pulsanti **non si tocca**: è un contratto col
JS. Dopo: padding 0, bordo 0, raggio 0, cursore `auto`, e l'immagine riempie
la banda 1270×324 invece di 1242×306.

**2. `nigiri.webp`: il 45 % superiore è nero puro** (luminanza 0,003,
dettaglio 0,0005) e con il ritaglio centrato un terzo di quello che si vedeva
era quel nero. Nuova classe `.menu-foto--basso` con
`object-position:center 85%` — l'85 % è il **centro di massa del dettaglio**,
calcolato riga per riga, non scelto a occhio. La luminanza della finestra
visibile passa da 0,225 a 0,322, il dettaglio da 0,0149 a 0,0167.

**3. `.skip-link` animava `top`**, cioè una proprietà di layout: ogni
fotogramma rifaceva il calcolo della pagina. Ora scorre con `transform`.
Verificato: a riposo `bottom:-16` (fuori schermo), al focus `top:16`.
Comportamento identico, costo diverso.

**4. La parola «cameriere» nell'`alt` di `carne-girata`.** Diceva «Un
cameriere taglia la picanha… al tavolo»: è esattamente il servizio che il
locale **non** offre, e che il resto del sito ha smesso di promettere. Ora
«Uno del personale… passando fra i tavoli», in italiano e in inglese.

## Da correggere, se decidi di farlo — una

**L'hero.** È l'unica immagine dove la deriva non si giustifica col soggetto,
ed è quella che conta di più: sta a tutto schermo, è la prima cosa che si
vede, ed è l'inquadratura che dovrebbe somigliare alla sala vera.

Non da rifare da zero — `08-sala.png` ha già la geometria giusta (muro a
sinistra, lamelle che curvano dove finisce, colonna, apertura sul banco,
scala col parapetto di vetro), che è la parte difficile. Da **correggere**:

```
Same image, but rebalance the colour and the light of the room.

Reduce the warm amber cast that currently dominates the whole frame. The
walls are dark grey veined marble, close to neutral, not amber: let them
read grey. Bring back the petrol-blue of the backlit ceiling slats so the
blue reflects onto the marble tables and the floor, the way it does in the
reference photograph — the blue should be as present in the image as the
warm light, not a minor accent.

Raise the overall exposure by roughly one stop. The room is dimly lit but
not dark: mid-tones should sit around mid-grey, and the deep shadows should
keep some detail instead of falling to black.

Keep the warm amber light where it belongs and only there: the buffet
counter at the back, glowing as a warm pool of light, and the small lamps.
Everything away from the counter cools down towards grey and petrol blue.

Do not change the geometry of the room in any way: same wall on the left,
same ceiling slats curving where the wall ends, same column, same opening
onto the counter, same staircase with the glass balustrade, same tables in
the same positions. Only colour, white balance and exposure change.

No people. No text. No visible logos.
```

Impostazioni: rapporto **16:9**, risoluzione massima, qualità **Alta**,
numero **4**, «✨ Migliora prompt» **spento**, e in «Riferimenti immagine»
la foto vera — che ora sta in **`riferimenti/sala-x-sapori-originale.webp`**,
non più in `uploads/`.

**Come si controlla se è andata bene, senza discutere di gusti.** Rimetti il
file in `uploads/` e rimisura: l'obiettivo è **petrolio sopra il 30 %, ambra
sotto il 40 %, luminanza sopra 0,28**. Il riferimento sta a 40,1 / 19,8 /
0,386; l'hero di oggi a 13,8 / 72,5 / 0,177. Non serve arrivare al
riferimento: serve smettere di essere l'opposto.

Le quattro immagini del banco hanno la stessa deriva ma la stessa scusa (sono
primi piani di un bancone caldo). **Le lascerei stare** finché l'hero non è
sistemato: se poi l'hero diventa più freddo e il banco stona, si rifà anche
quello, con lo stesso blocco «Same image, but…».

## Scartate — nessuna

Nessuna immagine è irrecuperabile.

## Quello che non posso dirti

Il punto 3 del tuo Passo 2 — «sembra vera o si vede che è generata?» — chiede
di cercare mani sbagliate, posate deformi, bordi di piatti che non tornano,
texture che si ripetono. Sono difetti **di forma**, e la forma si vede: non
si misura con un istogramma. Il pannello non dipinge, quindi su questo non ho
niente di onesto da dire. Serve un paio d'occhi umani, dieci minuti, le
tredici immagini aperte a schermo intero.

---

# Passo 3 — Cosa manca

## Le quattro card delle cucine: la decisione è già presa

Il prompt mi chiede di cercare i vuoti. Questo **non è un vuoto**: è una
scelta scritta sopra la griglia in `index.html` e in `STATO-PROGETTO.md`. Il
principio è *poche e grandi* — una foto sta dove può respirare, oppure non
sta. Le card sono tavole grafiche costruite sul motivo delle lamelle, e
reggono da sole.

C'è anche un vincolo pratico che rende la questione un aut-aut: `DA-FORNIRE.md`
registra che **di foto per le card ce n'è una sola mancante, quella per
Italia**. Tre foto e una tavola grafica è la soluzione peggiore delle due.
Quindi: **o tutte e quattro, o nessuna.**

La mia raccomandazione è **nessuna**, e non per pigrizia: le card sono
`4:3` rese a circa 300 px di larghezza. Una fotografia di cibo a 300 px non
vende un piatto — lo miniaturizza. Le foto in questo sito funzionano dove
sono grandi: l'hero a 1359 px, la fascia a 1270, i riquadri della sala a 565.
Se vuoi che le cucine si vedano in fotografia, la mossa giusta non è riempire
le card ma **dare a una cucina alla volta una fascia larga**, come già fa
`banco-atmosfera`.

Se invece decidi di riempirle, dimmelo e scrivo i quattro prompt.

## L'unico vuoto vero: il tavolo con molti piattini

Già registrato in `PROMPT-IMMAGINI.md` come immagine 4, l'unica non ancora
fatta. Ha una ragione precisa che nessuna delle tredici immagini copre: **il
sito racconta un buffet, ma nessuna fotografia mostra il risultato del
buffet.** Ci sono il banco carico, il banco sushi, le mani del cuoco, la
carne girata — tutte dal lato di chi prepara. Manca il lato di chi mangia:
otto piattini diversi sullo stesso tavolo, che è la frase «quattro cucine, un
prezzo solo» detta in immagine.

Il contenitore reale è `.plate--wide`, **16:10**, reso a 565×353 nella
sezione «La sala» oppure — meglio — la fascia a tutta larghezza, che è 1270
di larghezza e dà spazio a un tavolo lungo.

```
A restaurant table seen from a low angle, at table height, not from above.

On a light grey-white marble table top with a thin brass edge profile, eight
to ten small plates crowd together: three nigiri on one, a few gyoza on
another, a small heap of wok vegetables, two slices of grilled picanha, a
little pasta, some sliced fresh pineapple, a bamboo steamer basket with its
lid half off. The plates are small, white and plain, of different shapes and
sizes, overlapping and slightly untidy, as if people have been going back and
forth to the counter and putting things down wherever there was room. Two
sets of chopsticks and a fork rest on the plates. A glass of water.

The room behind is a dark grey veined marble wall, out of focus, with the
petrol-blue backlit ceiling slats visible at the top of the frame and their
blue reflected faintly on the marble table. The warm glow of the buffet
counter is far in the background, small and out of focus. Warm low light on
the food, cool petrol blue in the surroundings.

Shallow depth of field: the nearest plates sharp, the far end of the table
soft.

No people, no hands, no faces. No drinks other than water — no wine, no beer,
no cocktails. No text, no logos, no menus on the table.
```

Impostazioni: rapporto **16:10**, risoluzione massima, qualità **Alta**,
numero **4**, «Migliora prompt» **spento**, riferimento la foto vera.

Il blocco «no wine, no beer» non è un vezzo: **le bevande non sono incluse nel
prezzo**, e metterle in evidenza è una promessa sbagliata. È lo stesso motivo
per cui `12-carne-girata` è stata scelta al posto delle varianti col calice
di vino rosso.

## Il resto delle sezioni: stanno meglio senza

Ho guardato le sezioni senza immagine. «Dove siamo» ha la mappa. «Prenota» è
un modulo, e una fotografia sopra un modulo distrae da un compito. La privacy
e la 404 non le vuole nessuno illustrate. **Nessuna proposta**, perché
nessuna occupa un vuoto vero.

---

# Passo 4 — Video

**Ricordando che oggi non esiste nessun file**, e che l'impianto invece è
completo e collaudato.

## Dove ha senso: un punto solo

**L'hero.** È l'unico posto del sito costruito per ospitarlo, con il
comportamento già scritto e verificato in `js/site.js`.

Ma con un'avvertenza che vale più del video: **l'hero oggi non è fermo.**
`heroZoom` gli dà 14 secondi di avvicinamento lento, e costa zero byte. Un
video ci guadagna solo se porta **un movimento che una foto non può avere** —
il vapore che sale, la carne che gira, le persone che passano. Un video della
sala ferma con una lenta panoramica non batte `heroZoom`: costa 2 MB e
aggiunge poco.

Quindi il video giusto per l'hero non è la sala: è **il banco in carrellata**,
dove il movimento è l'abbondanza che scorre.

```
Slow steady lateral tracking shot moving from left to right along a lit
buffet counter, at chest height.

Trays of food pass through frame one after another: steamed rice, stir-fried
vegetables, bamboo baskets of dumplings with steam rising, trays of nigiri
and maki under glass. Stacks of clean white plates glow under the counter
lip. Steam drifts upward continuously.

The counter is warm amber light. Above and behind, the ceiling slats are
backlit petrol blue, and the blue reflects on the dark grey marble wall and
on the glass. Dark grey veined marble surfaces everywhere away from the
counter.

The camera moves at a constant slow speed and never stops, never zooms,
never tilts. One single continuous movement, no cuts.

No people, no faces, no hands. No text, no logos. No wine or beer glasses.
```

Impostazioni video, da `PROMPT-IMMAGINI.md §1`: modello **Seedance 2.5**,
rapporto **16:9**, **1080p**, durata **il massimo disponibile**, «Genera
audio» **spento**, numero **1**, «Migliora prompt» **spento**.

**«Inizio fotogramma» = «Termina frame»: qui NO.** Una carrellata che torna
al punto di partenza si vede che torna indietro. Meglio scegliere un tratto
di banco visivamente uniforme, così il salto del loop non si nota perché non
c'è niente di riconoscibile da riconoscere.

## Comportamento richiesto

L'impianto lo fa già, ma questo è il contratto da rispettare:

| | |
|---|---|
| **Poster** | il primo fotogramma del video, non un'immagine diversa: `js/site.js` usa `poster.currentSrc` dell'`<img>` dell'hero, quindi il video deve **partire dalla stessa inquadratura** di `sala.webp`, altrimenti si vede lo scarto nell'istante in cui parte |
| **Sotto i 768 px** | nessun video, solo il poster. Da aggiungere: oggi il JS blocca su `saveData` e su 2G/3G, ma **non sulla larghezza** |
| **Fallback** | già gestito: se il file manca o l'autoplay viene rifiutato, resta la fotografia |
| **Riduci movimento** | già gestito, il video non parte |
| **Pausa** | già gestita, pulsante da 44 px — WCAG 2.2.2 |
| **Overlay** | già presente: le sfumature dell'hero. Da **rimisurare** dopo aver montato il video, perché il contrasto del titolo oggi è verificato contro una fotografia ferma, non contro fotogrammi che cambiano. Il fotogramma più chiaro è quello che comanda |
| **Formato e peso** | `.webm` VP9 **più** `.mp4` H.264 (nessuno dei due copre tutti i browser), **sotto 2 MB per file**, muto |

## L'altro video, che però non va nell'hero

**La carne girata.** È il gesto più spettacolare del locale, ed è già scritto
in `PROMPT-IMMAGINI.md` come V1. Ma **non è un video da sfondo**: ha un gesto
che si compie, quindi non chiude l'anello, e dietro a un titolo un movimento
che finisce è una distrazione. Sta bene dov'è già la fotografia, in «Come
funziona»: un riquadro 16:10 che parte quando entra nello schermo e si ferma
alla fine, senza loop. Non è previsto dall'impianto attuale e richiede
codice nuovo — **lo lascerei per ultimo**, dopo che l'hero funziona.

## Dove NON mettere video

«La sala», «Dove siamo», il menu, la prenotazione. Nel menu in particolare il
lettore sta cercando un piatto: un movimento nella pagina è un ostacolo, non
un ornamento.

---

# Passo 5 — Animazioni

## Prima: quello che c'è già

Il prompt propone «sei-otto idee» come se il terreno fosse vergine. Non lo è.
Misurato:

- **11 `@keyframes`**: `enter`, `heroZoom`, `heroZoomSoft`, `draw`, `spunta`,
  `salta-su`, `salta-giu`, `conta`, `entra-dal-basso`, `scuoti`, `spin`
- **33 elementi `.reveal`** sulla sola home, con `IntersectionObserver` in
  `js/site.js` e ritardi scaglionati via `--d`
- **5 blocchi `prefers-reduced-motion`**, che coprono la barra fissa, le fasce
  orarie, i contatori, il totale stimato, i messaggi del modulo e i campi non
  validi

L'ingresso in scena, gli stati del modulo e gli elementi ricorrenti — tre
delle cinque aree che il prompt chiede di coprire — **sono già fatti, e fatti
bene**. Aggiungere sei idee sopra questo impianto significa accumulare.

Quindi: **quattro correzioni applicate**, e una proposta in meno di quelle
che avevo in mente.

## La transizione fra video e fotografia: c'era già

Il prompt chiede di coprire «le transizioni fra i video in loop e le immagini
statiche circostanti». Avevo scritto una proposta per questo. **Era già
implementata e non me n'ero accorto**, perché avevo cercato il tag `<video>`
nell'HTML invece di leggere il blocco CSS: `styles.css:487` dichiara
`.hero__video{opacity:0;transition:opacity 1.2s}` e
`.hero__bg[data-video-attivo="true"] .hero__video{opacity:1}`, mentre
`js/site.js:136` accende l'attributo sull'evento `playing`. La fotografia
sotto non viene nemmeno rimossa: scende a `opacity:.35`, così resta
disponibile se il video viene messo in pausa.

È un impianto migliore di quello che stavo per proporre. Lasciato intatto.

## Applicate — quattro

**`.skip-link` non anima più `top`.** Vedi Passo 2. Versione ridotta:
`transition:none`.

**La fascia fotografica non si comporta più come un pulsante.** Non era
un'animazione voluta: era la collisione di nomi. Al passaggio del mouse
cambiava bordo, al clic scattava di 1 px.

**Le card rispondono al tocco** — sotto.
**Il filetto d'ottone si disegna** — sotto.

### 1. Le card delle cucine non rispondevano al tocco

**Perché.** Sono link, e su desktop hanno `:hover`. Su telefono `:hover` non
esiste: si tocca una card e non succede niente finché la pagina nuova non
arriva. Su una connessione lenta sono due secondi in cui l'utente non sa se
il tocco è stato registrato, e tocca di nuovo.

**Costo:** 3 righe di CSS, in `styles.css` accanto a `.card:hover`. Nessun JS,
nessun asset. `.card` dichiara già `transition:transform`, quindi non serve
aggiungerla.

Versione ridotta: il blocco globale `prefers-reduced-motion` a `styles.css:1298`
porta già ogni `transition-duration` a 1 ms — la scala arriva istantanea, che
è il comportamento giusto.

Verificato a 375 px: `hover:none` corrisponde, la card è larga 154 px, quindi
`scale(.985)` sposta ogni bordo di **1,2 px**. Percepibile al tocco, invisibile
altrimenti.

### 2. Il filetto d'ottone della fascia si disegna quando arriva

**Perché.** È l'unico elemento ricorrente della sala che nel sito non si
muove mai, ed è il segno che tiene insieme le sezioni. Un filetto che si
disegna da sinistra invece di essere già lì dà alla pagina un ritmo di
lettura senza chiedere attenzione. Riusa `.reveal`, quindi
l'`IntersectionObserver` esiste già.

**Costo:** 8 righe di CSS, zero JS — l'osservatore esiste già. Aggiunta la
classe `reveal` alla `<div class="fascia-foto">` in `index.html` e
`en/index.html`, quindi la banda entra in dissolvenza come gli altri 33
elementi e il filetto si disegna insieme a lei.

`js/site.js:234` gestisce tre casi e li gestisce bene: con «riduci movimento»
o senza `IntersectionObserver` mette `is-in` subito, e c'è pure una sentinella
che mostra tutto se l'osservatore non risponde. Quindi il filetto non può
restare invisibile.

Versione ridotta: `transform:scaleX(1)` e `transition:none`, dichiarati
esplicitamente oltre al blocco globale.

**Verifica.** Il pannello di questa sessione non produce frame, quindi le
transizioni non avanzano e **lo stato intermedio non è osservabile**. Quello
che ho potuto misurare è lo stato di arrivo, azzerando le transizioni: banda
`opacity:1` e `transform:none`, filetto `scaleX(1)` largo 1270 px su desktop
e 375 px a 375 px di viewport, nessuno scroll orizzontale, nessun errore in
console. Che l'animazione *finisca* dove deve è verificato; che sia gradevole
mentre scorre, no.

## Tre proposte che ho scartato

Le scrivo perché il prossimo che legge non le riproponga.

- **Parallasse sull'hero.** `heroZoom` fa già il lavoro. Due movimenti
  sovrapposti dietro allo stesso titolo lo rendono meno leggibile, non più
  vivo.
- **Animazione sul contatore dei coperti al passaggio del mouse.** Esiste già
  `conta`, e scatta quando il valore cambia — cioè quando c'è qualcosa da
  dire. Un'animazione al passaggio del mouse direbbe niente.
- **Ingresso scaglionato sulle 67 righe del menu.** Il lettore sta cercando un
  piatto. Farglielo aspettare per 67 volte è un ostacolo travestito da cura.

---

# Cosa resta da decidere

| | Serve da te |
|---|---|
| **L'hero ambrato** | una tornata di generazioni col prompt del Passo 2, e la misura di controllo (petrolio > 30 %, ambra < 40 %, luminanza > 0,28) |
| **Il tavolo con molti piattini** | una tornata col prompt del Passo 3 |
| **Le quattro card cucine** | **decise: restano grafiche.** Se cambi idea servono tutte e quattro le foto, e scrivo i prompt |
| **Il video del banco** | una generazione Seedance, e poi il blocco sotto i 768 px e la rimisura del contrasto del titolo |
| **Le animazioni** | **fatte.** Non resta niente da decidere |

## Le due cose che nessuno ha ancora guardato con gli occhi

Le scrivo qui perché non si perdano fra i numeri.

1. **Se le tredici immagini sembrino generate.** Difetti di forma — mani,
   posate, bordi dei piatti, texture ripetute. Dieci minuti a schermo intero.
2. **Se le animazioni siano gradevoli mentre scorrono.** So che finiscono
   dove devono; non so come si vedono.

*(Qui c'era un terzo punto: il 403 su `riferimenti/`, «verificato
sull'anteprima ma non su Apache». È stato provato su Apache poco dopo, e la
prova ha trovato che **la regola non funzionava affatto** — vedi il racconto
più su. Ora funziona, con due difese indipendenti.)*

## Le immagini sono cambiate dopo che questo documento è stato scritto

Il 25 agosto 2026 sono state generate **ventuno varianti responsive**, e
`srcset` è passato da una immagine su tredici a tutte. I nomi dei file
originali non cambiano — `banco.webp` resta `banco.webp` — ma accanto ci
sono ora `banco-640`, `banco-960`, `banco-1280`.

**Se rigeneri un'immagine, vanno rigenerate anche le sue varianti**,
altrimenti il sito serve la foto nuova sui schermi grandi e quella vecchia
su tutti gli altri. Il modo è descritto nel commit `b18e9ec`: il browser
legge il file, ridimensiona su canvas e scrive attraverso un endpoint
temporaneo del server di anteprima locale.

Vale in particolare per **l'hero**, che è l'immagine da correggere: ha
cinque gradini (768, 1440, 1600, 2048, 2880).
