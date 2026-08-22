# Prompt per generare le immagini del sito

Scritti il 22 agosto 2026. In inglese perché i modelli lavorano molto meglio
in inglese, anche quando il sito è in italiano.

---

## Come si usano

Ogni prompt è fatto di **due pezzi**:

1. il **BLOCCO SALA**, sempre identico — è quello che fa sembrare le foto
   scattate tutte nello stesso posto;
2. la **scena**, diversa per ogni immagine.

Si incollano uno dietro l'altro, il blocco sala per primo.

Se cambiate il blocco sala fra un'immagine e l'altra, il sito finisce per
mostrare sei locali diversi: è l'errore più facile e il più visibile.

### Impostazioni

- **Formato**: quello scritto in ogni scheda. Non ritagliate dopo: un 16:9
  ottenuto tagliando un 4:3 perde un quarto dell'inquadratura.
- **Dimensione**: la più grande che lo strumento permette. Se non arriva a
  2400 px di lato lungo, generate al massimo disponibile e ingrandite dopo.
- **Quante**: 3 o 4 varianti per soggetto, poi si sceglie.

### Da controllare prima di tenere una variante

- **Le mani.** È l'errore più frequente: dita in più, dita fuse, nocche
  impossibili. Guardate al 100%, non in miniatura. Nel primo giro una
  variante su quattro aveva la mano destra deformata.
- **Il testo.** Qualunque scritta dentro l'immagine sarà sbagliata: insegne,
  etichette, menù. Meglio inquadrature senza scritte.
- **I riflessi** sull'ottone e sul marmo: se sembrano plastica, scartate.

---

## BLOCCO SALA — da incollare all'inizio di ogni prompt

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
The ceiling is covered with curved petrol-blue metal slats, each one backlit
with warm hidden light. The walls are dark charcoal marble with fine, thin,
restrained white veining — a subtle web, not big dramatic marble streaks.
The floor is polished light warm-grey stone in large seamless slabs, glossy
enough to hold soft reflections of the chairs and of the warm lights; no
visible grout lines, no matte tiles, no small-format tiling. Tables are
light warm marble with a thin brass edge, a few millimetres only, on a slim
dark base. Chairs are upholstered in petrol-blue leather with slim brass
legs. Evening service, warm low lighting around 2700K, no daylight.
Photographic, full-frame camera, 35mm lens, natural depth of field,
realistic materials, no glossy plastic look.
```

> **Perché il blocco è così pignolo sul pavimento.** Confrontando le due
> immagini del primo giro sono saltate fuori tre differenze: nella foto
> della sedia il pavimento è a piastrelle opache con le fughe in vista,
> mentre nella sala è pietra lucida che riflette le sedie; il marmo del muro
> è molto più drammatico, con venature grosse invece che sottili; e il bordo
> del tavolo è una fascia spessa color sabbia invece del filetto d'ottone.
> **La sala è quella giusta**, perché ricalca la fotografia vera del locale.
> Le tre righe aggiunte al blocco servono esattamente a non ripetere questi
> tre scarti.

## DA EVITARE — da incollare alla fine di ogni prompt

```
Avoid: visible faces, text, signage, labels, logos, watermarks, fisheye
distortion, HDR glow, oversaturated colours, plastic-looking surfaces,
empty serving trays, minimalist single-portion plating, black studio
background.
```

> L'ultima riga è importante: il fondo nero da studio è quello che fa
> sembrare le foto costose, ed è esattamente l'effetto sbagliato per un
> all you can eat. Lì vende l'abbondanza, non la rarità.

---

# Le due che servono davvero

## 1. La sala — è l'hero, la prima cosa che si vede

**Formato 16:9 · 2400×1350 · orizzontale**

```
[BLOCCO SALA]

Wide establishing shot of the dining room, camera at seated eye height,
about 120 cm from the floor. Tables set and empty, ready before service.
The curved blue ceiling slats run across the top of the frame. On the right,
in the background, the warm golden glow of the buffet counter. Calm,
welcoming, a room that looks cared for. Leave the upper left third of the
frame relatively empty and uncluttered.

[DA EVITARE]
```

> Lo spazio vuoto in alto a sinistra non è un vezzo: lì ci va il titolo del
> sito. Senza, il testo finisce sopra le sedie e non si legge.

## 2. Il banco carico — è il prodotto, e oggi non esiste

**Formato 16:9 · 2400×1350 · orizzontale**

```
[BLOCCO SALA]

The buffet counter seen from a three-quarter angle, generously full.
Stone and steel serving wells filled with food: steamed dumplings, grilled
vegetables, rice, noodles, sliced fresh fruit. Warm lights under the counter
edge, brass detailing on the counter front, a glass guard above. Light steam
rising from the hot section. The food looks abundant and just replenished.

[DA EVITARE]
```

> Tutto il sito adesso dice «ci si serve al banco» e non c'è una sola
> immagine di un banco. È l'unico buco vero.

---

# Le quattro che migliorano

## 3. La carne girata al tavolo

**Formato 16:9 · 1920×1080 · orizzontale**

```
[BLOCCO SALA]

Close-up of a waiter carving grilled picanha from a long metal skewer onto
a plate held at a table. The knife catches the warm light, the meat has a
dark crust and a pink centre. Hands and forearms visible, face out of frame.
Shallow depth of field, the dining room softly blurred behind.

[DA EVITARE]
```

> È il momento più bello che avete da raccontare: il buffet che per un attimo
> diventa servizio al tavolo. Va nella sezione «Ogni tanto passiamo noi».

## 4. Il tavolo con molti piattini

**Formato 4:3 · 1600×1200 · orizzontale**

```
[BLOCCO SALA]

A marble table seen from a high three-quarter angle, covered with six or
seven small plates brought back from the buffet: a few nigiri, some grilled
vegetables, steamed dumplings, a little rice, a small dessert. Glasses and
brass cutlery around them. The abundance of a shared table, not a composed
still life.

[DA EVITARE]
```

> Questa racconta il valore: tanti assaggi, un prezzo solo. È l'immagine che
> manca di più al messaggio.

## 5. Il banco sushi durante il servizio

**Formato 16:10 · 1600×1000 · orizzontale**

```
[BLOCCO SALA]

The sushi station during service: a dark stone counter with trays of nigiri
and maki, a chef's hands shaping rice in the background, out of focus.
Warm light from above, the blue slats reflected on the glass.

[DA EVITARE]
```

## 6. I dolci

**Formato 4:3 · 1600×1200 · orizzontale**

```
[BLOCCO SALA]

The dessert section of the buffet: sliced fresh pineapple, small cakes,
mochi, a bowl of chocolate, fruit cut to order. Warm light, generous
quantities, plates being refilled.

[DA EVITARE]
```

---

## Dove finiscono, una volta pronte

| # | Immagine | Slot nel sito | Misura reale a schermo |
|---|---|---|---|
| 1 | La sala | hero della home | 1430×911, il doppio su schermi Retina |
| 2 | Il banco | sezione «Come funziona» | 570×357 |
| 3 | Carne girata | passo «Ogni tanto passiamo noi» | 570×357 |
| 4 | Tavolo con piattini | card o sezione «La sala» | 570×357 |
| 5 | Banco sushi | sezione «La sala» | 570×357 |
| 6 | Dolci | card | 270×202 |

Le misure sono quelle misurate nel browser a 1440 px di finestra: servono a
capire che **solo l'hero ha bisogno di essere davvero grande**. Per tutti gli
altri slot 1280 px di lato lungo bastano già.

---

# Appendice — le immagini che avete già

Delle sette immagini tenute dal primo giro, **cinque bastano così come
sono** per lo slot in cui finiscono. Misurato nel browser, dopo il ritaglio:

| Immagine | Ho | Slot | Serve | Dopo il ritaglio | Esito |
|---|---|---|---|---|---|
| Vapore | 1280×720 | card 4:3 | 540×404 | 960×720 | basta |
| Salsa soia | 1280×720 | card 4:3 | 540×404 | 960×720 | basta |
| Piatto vuoto | 1280×720 | media 16:10 | 1141×713 | 1280×800 | basta |
| Mani salmone | 1280×720 | menu 16:10 | 1141×713 | 1280×800 | basta |
| Nigiri | 832×1040 | piccola nel menu | ~400×500 | — | basta |
| Sedia e tavolo | 1024×1024 | tavola 16:10 | 1141×713 | 1024×640 | corta del 10% |
| Marmo scuro | 1280×720 | fondo a larghezza piena | 2880 largo | — | vedi sotto |

## 7. La sedia e il tavolo, in 16:10

**Solo se state già generando altro.** Quella che avete è quadrata: tagliata
in 16:10 resta 1024×640 invece dei 1141 che servirebbero. È uno scarto che
si nota solo affiancando le due versioni.

**Formato 16:10 · 1600×1000 · orizzontale**

```
[BLOCCO SALA]

Close-up detail of one dining chair and the corner of a table. The
petrol-blue leather seat and the slim brass frame fill the left half of the
frame; the light marble tabletop with its thin brass edge crosses the upper
right, with two glasses and a small plate on it. The dark veined marble wall
behind. Low warm light grazing the brass.

[DA EVITARE]
```

## Il marmo scuro non va rigenerato

Non è una fotografia, è una **texture**, e le texture non si giudicano a
pixel. Va usata in uno di questi due modi, e in entrambi 1280 px bastano:

- **a piastrella**, ripetuta con `background-repeat`;
- **sotto una velatura scura**, come materiale appena percepibile dietro al
  testo.

Serve a 2400 px solo se la volete nitida a tutta larghezza — ed è proprio
quello che conviene evitare: a piena nitidezza una parete di marmo venato
ruba l'attenzione alle parole che ci stanno sopra. È un fondale, non un
soggetto.

---

# I video

## Prima: dove vanno, e dove non vanno

Oggi il sito ha **un solo posto pronto per un video**: l'hero. Il codice
c'è, è stato provato, e si accende con un attributo.

Ma il consiglio è di **non metterlo lì**. Un video di sfondo a tutto schermo
è la scelta che fanno tutti ed è quella che rende meno: sta dietro al testo,
quindi va sfocato e scurito per non disturbare, e a quel punto non si capisce
più cosa mostri. Costa banda e non racconta niente.

Il posto che rende davvero è **il passo «Ogni tanto passiamo noi»**: un
riquadro piccolo, in loop, con la carne girata al tavolo. Un video di quattro
secondi nel punto esatto in cui il testo racconta quella cosa vale dieci
volte un video decorativo a tutto schermo, e pesa un decimo. Quel riquadro
va costruito: non esiste ancora.

## Requisiti tecnici

Validi per tutti, e già scritti in `DA-FORNIRE.md`:

- **orizzontale**, minimo 1920×1080;
- **6-12 secondi** per l'hero, **3-5** per i riquadri piccoli;
- **nessun audio**: parte comunque muto, l'audio è solo peso;
- **camera ferma o movimento lentissimo**, nessuno stacco, nessuno zoom
  brusco, nessun effetto;
- **niente volti riconoscibili** senza consenso scritto;
- **niente testo dentro al video**: non si traduce e non si legge da telefono.

## Il trucco del loop

Quasi nessun modello genera un vero anello: l'ultimo fotogramma non combacia
col primo e si vede uno scatto ogni giro.

Il modo di aggirarlo non è tecnico, è di scelta del soggetto. **Funzionano da
soli i soggetti senza inizio né fine**: il vapore che sale, una carrellata
lentissima, il riflesso che scorre. Non funzionano i gesti compiuti: una
mano che taglia comincia e finisce, e allo stacco si vede.

Quindi: per i loop lunghi, soggetti continui. Per i gesti, video corti in un
riquadro che il visitatore guarda una volta sola.

## Da immagine, non da testo

Tutti questi si generano meglio **partendo da un'immagine** (image-to-video)
invece che dal solo testo: così la sala resta quella e non cambia a ogni
generazione. La riga «PARTIRE DA» dice quale file usare.

---

## DA EVITARE — VIDEO, da incollare alla fine di ogni prompt video

Diverso da quello delle immagini: qui i guai non sono i materiali, sono i
movimenti. Il blocco sala invece **non serve**, perché l'aspetto della sala
lo porta già l'immagine di partenza.

```
Keep the exact composition, framing, lighting and objects of the source
image. Avoid: camera shake, handheld movement, zoom, pans other than the
one described, cuts, transitions, speed ramps, slow-motion effects, people
entering the frame, visible faces, text or captions, morphing or warping of
hands, food or objects, extra fingers, and any change to the room, the
furniture or the light.
```

---

## V1. La carne girata — il più utile

**PARTIRE DA**: l'immagine 3 (carne girata), una volta generata
**4-5 secondi · 1920×1080**

```
Very slow motion. The long knife draws once down the picanha on the skewer
and a single slice folds away and falls onto the plate. The camera does not
move at all. Warm light, the dining room blurred behind. Nothing else in
the frame moves.

[DA EVITARE — VIDEO]
```

> Un solo gesto, camera immobile. Va nel riquadro del passo «Ogni tanto
> passiamo noi», non nell'hero.

## V2. Il vapore — il loop perfetto

**PARTIRE DA**: `04-vapore.png`
**6-8 secondi · 1920×1080**

```
The steam rises and curls slowly and continuously from the bowl. The camera
is completely still. The bowl does not move. Nothing enters or leaves the
frame. Soft, even, endless movement.

[DA EVITARE — VIDEO]
```

> È il soggetto che si ripete meglio in assoluto: non ha inizio né fine,
> quindi il loop non si vede. Se volete un video di sfondo nell'hero, è
> questo il candidato giusto, non la sala.

## V3. Il banco, in carrellata

**PARTIRE DA**: l'immagine 2 (il banco carico), una volta generata
**8-10 secondi · 1920×1080**

```
The camera drifts very slowly sideways along the buffet counter, from left
to right, at a constant speed. Steam rises gently from the hot section. The
food does not move. No zoom, no tilt, no cuts.

[DA EVITARE — VIDEO]
```

> Racconta l'abbondanza meglio di qualunque foto ferma, perché il banco
> non finisce mai nell'inquadratura.

## V4. La sala, per l'hero

**PARTIRE DA**: l'immagine 1 (la sala 16:9), una volta generata
**8-12 secondi · 1920×1080**

```
Extremely slow push-in towards the dining room, a few centimetres per
second. The room is empty and still. Only the light stays alive. No people,
no objects moving, no camera shake.

[DA EVITARE — VIDEO]
```

> Solo se volete comunque il video nell'hero. Chiedete il movimento **più
> lento di quanto vi sembri giusto**: dietro a un titolo, un movimento
> percepibile diventa illeggibilità.

---

## Cosa guardare prima di tenere un video

- **Le mani e i coltelli**: è dove l'AI cede per prima. Guardate a velocità
  ridotta, non a schermo intero.
- **La carne e il cibo che si deforma** fra un fotogramma e l'altro.
- **Il vapore che diventa una macchia** invece di dissolversi.
- **L'ultimo fotogramma contro il primo**: se sono molto diversi, quel video
  non può andare in loop.

## Conversione

Vanno consegnati in **due formati** — WebM VP9 e MP4 H.264 — perché nessuno
dei due copre tutti i browser, con obiettivo **sotto 2 MB per file**. Sopra
quel peso l'hero diventa più lento della pagina intera e il video fa più
danni che bene.

La conversione richiede `ffmpeg`, che su questo computer non è installato:
va installato (è gratuito) oppure fatta la conversione altrove. Mandate pure
l'originale anche se pesa 200 MB.

---

# Come impostare il tool

Riferito alle due schermate del 22 agosto 2026. Se l'interfaccia cambia, il
ragionamento sotto ogni voce resta valido.

## Immagini — scheda «Immagine»

| Voce | Com'è ora | Metti | Perché |
|---|---|---|---|
| Modello | GPT Image 2 | **lascia** | Va bene, è quello che ha già dato i risultati buoni |
| Rapporto | 16:9 | **quello scritto nella scheda** | Cambia per ogni immagine: 16:9, 4:3 o 16:10. Vedi ogni prompt |
| Risoluzione | 1K | **la più alta disponibile** | 1K vuol dire circa 1024 px: basta per tutti gli slot tranne l'hero |
| Qualità | Medio | **Alta** | È la voce che costa meno e rende di più |
| Numero | 4 | **4** | Giusto così: si scarta molto |
| ✨ Migliora prompt | Acceso | **🔴 SPEGNI** | Vedi sotto, è la voce più importante di tutte |
| Riferimenti immagine | vuoto | **metti la foto vera della sala** | Vedi sotto |

### ✨ «Migliora prompt» va spento

Quella levetta fa riscrivere il prompt al tool prima di generare. Sembra
comoda ed è il motivo per cui le immagini del primo giro non combaciano fra
loro: se il testo viene riscritto ogni volta in modo diverso, **il BLOCCO
SALA non serve più a niente**, perché quello che arriva al modello non è più
identico. È esattamente così che nasce il pavimento sbagliato.

Tutto il lavoro sui prompt qui dentro ha senso solo con quella levetta spenta.

### «Riferimenti immagine»: usalo sempre

È il riquadro in alto a sinistra. Caricaci **la fotografia vera del locale**
(non una generata) e lasciala lì per tutte le generazioni.

Fa un lavoro che nessuna descrizione scritta può fare: il testo può dire
«marmo scuro venato», ma solo l'immagine può dire *quel* marmo. Con il
riferimento attaccato, pavimento, muri e luce restano gli stessi senza doverli
descrivere al millimetro.

### «3 rimasti»

Le generazioni sono contate. Con quattro varianti per volta, tre tentativi
sono dodici immagini: abbastanza per **una sola** delle due immagini che
servono. Quindi:

1. prima **la sala** (è l'hero, ed è quella che deve venire perfetta);
2. poi ricarichi e fai **il banco**;
3. le altre quattro solo dopo, se avanza.

Non spendere tentativi sulle immagini «che migliorano» finché le due che
servono non sono buone.

---

## Video — scheda «Video»

| Voce | Com'è ora | Metti | Perché |
|---|---|---|---|
| Modello | Seedance 2.5 | **lascia** | |
| Rapporto | 16:9 | **16:9** | Giusto, l'hero e i riquadri sono orizzontali |
| Risoluzione | 720p | **1080p se c'è** | 720p è sotto il minimo del sito |
| Durata | 4s | **4s** per V1 e V2, il massimo per V3 e V4 | Vedi sotto |
| 🔊 Genera audio | Acceso | **🔴 SPEGNI** | I video del sito partono muti per forza: l'audio è solo peso e tempo di generazione buttato |
| Numero | 1 | **1**, poi valuti | Un video costa molto più di un'immagine |
| ✨ Migliora prompt | Acceso | **🔴 SPEGNI** | Stesso motivo delle immagini |

### La scoperta utile: «Inizio fotogramma» e «Termina frame»

Sono i primi due riquadri della scheda video, e **risolvono il problema del
loop** di cui parlavo prima.

Se metti **la stessa identica immagine** sia come fotogramma iniziale sia
come fotogramma finale, il video parte e finisce dallo stesso punto: l'anello
si chiude e lo scatto a ogni giro sparisce.

Vale la pena farlo per:

- **V2, il vapore** — parti e finisci da `04-vapore.png`;
- **V4, la sala** — parti e finisci dalla sala, e ottieni una carrellata che
  va e torna senza che si veda il salto.

**Non** per V1, la carne girata: lì il gesto deve compiersi, e infatti quel
video non va in loop ma si guarda una volta sola.

### La durata

- **V1 carne girata**: 4 s. Un solo taglio. Più lungo significa che il
  modello deve inventarsi un secondo gesto, ed è lì che le mani si rompono.
- **V2 vapore**: 4 s bastano, se chiudi l'anello con inizio = fine.
- **V3 banco** e **V4 sala**: qui servirebbero 8-10 s. Se il massimo è 4,
  prendi 4 e chiedi un movimento **ancora più lento**: una carrellata breve e
  lentissima in loop rende meglio di una lunga e veloce.

---

## L'ordine in cui farei le cose

1. **Immagine 1, la sala.** Riferimento attaccato, ✨ spento, qualità alta,
   16:9, risoluzione massima, 4 varianti. Guardi le mani, il pavimento e il
   marmo del muro. Se non è giusta, rifai: è la più importante del sito.
2. **Immagine 2, il banco.** Stesse impostazioni.
3. **Mandamele.** Le guardo prima che tu spenda altri tentativi.
4. Solo dopo i video, e solo **V1 e V2** — sono i due che rendono davvero.
   V3 e V4 sono facoltativi.

Le quattro immagini «che migliorano» e i video V3/V4 sono un di più: il sito
funziona senza. Le due immagini e i due video corti no, quelli cambiano tutto.
