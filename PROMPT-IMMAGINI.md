# Prompt per immagini e video del sito

Riscritto il 22 agosto 2026.

**Ogni prompt qui dentro è completo.** Si copia il blocco intero e si incolla:
non c'è niente da sostituire, niente da assemblare, nessun segnaposto.

> La versione precedente usava i segnaposto `[BLOCCO SALA]` e `[DA EVITARE]`
> da sostituire a mano. Nel primo giro sono stati incollati alla lettera, e il
> modello li ha ricevuti come testo privo di senso: la descrizione della sala
> non gli è mai arrivata. È così che è venuto fuori il pavimento sbagliato.
> Da qui la regola: **un prompt, un blocco, zero montaggio.**

---

# 1. Le impostazioni del tool

Prima dei prompt, perché due di queste contano più di tutto il resto.

## 🔴 «✨ Migliora prompt» va SPENTO

In tutte e due le schede, Immagine e Video.

Quella levetta fa riscrivere il prompt al tool prima di generare. Se il testo
viene riscritto ogni volta in modo diverso, **al modello non arriva mai la
stessa descrizione della sala** — e le immagini non combaciano fra loro per
quanto curati siano i prompt. Con quella accesa, tutto questo file è inutile.

## 🎬 «Inizio fotogramma» = «Termina frame»

Nella scheda Video, i primi due riquadri. Mettendo **la stessa immagine** in
entrambi, il video parte e finisce dallo stesso punto: l'anello si chiude e
lo scatto a ogni giro sparisce.

Da fare per il vapore e per la sala. **Non** per la carne girata: lì il gesto
deve compiersi, e infatti quel video non va in loop.

## Il resto

### Scheda Immagine

| Voce | Metti | Perché |
|---|---|---|
| Modello | GPT Image 2 | va bene |
| Rapporto | **quello scritto in ogni scheda** | cambia: 16:9, 4:3 o 16:10 |
| Risoluzione | **la più alta disponibile** | 1K ≈ 1024 px: basta per tutto tranne l'hero |
| Qualità | **Alta** | è la voce che rende di più |
| Numero | **4** | si scarta molto |
| ✨ Migliora prompt | **Spento** | vedi sopra |
| Riferimenti immagine | **la foto vera del locale** | vedi sotto |

**Riferimenti immagine.** Caricaci la fotografia vera della sala, non una
generata, e lasciala per tutte le generazioni. Fa un lavoro che nessuna
descrizione può fare: il testo può dire «marmo scuro venato», solo l'immagine
può dire *quel* marmo.

### Scheda Video

| Voce | Metti | Perché |
|---|---|---|
| Modello | Seedance 2.5 | va bene |
| Rapporto | **16:9** | |
| Risoluzione | **1080p se c'è** | 720p è sotto il minimo del sito |
| Durata | **4s** per V1 e V2, il massimo per V3 e V4 | |
| 🔊 Genera audio | **Spento** | i video del sito partono muti: l'audio è peso buttato |
| Numero | **1** | un video costa molto più di un'immagine |
| ✨ Migliora prompt | **Spento** | |

## L'ordine, viste le generazioni contate

Con 4 varianti per volta, tre tentativi bastano per **una sola** immagine.

1. **La sala** — è l'hero, deve venire perfetta
2. **Il banco** — è il prodotto, e oggi non esiste
3. **Fermati e falle vedere** prima di spendere altro
4. Poi i video V1 e V2
5. Tutto il resto solo se avanza

---

# 2. Le due immagini che servono

## IMMAGINE 1 — La sala (l'hero)

**16:9 · risoluzione massima · orizzontale**

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
The ceiling is covered with curved petrol-blue metal slats, each one backlit
with warm hidden light. The walls are dark charcoal marble with fine, thin,
restrained white veining, a subtle web, never big dramatic streaks and never
gold or amber veins. The floor is polished light warm-grey stone in large
seamless slabs, glossy enough to hold soft reflections of the chairs and of
the warm lights; no visible grout lines, no matte tiles, no small-format
tiling. Tables are warm light grey-beige marble, finely speckled, with a thin
brass edge only a few millimetres deep, on a slim dark base. Chairs are
upholstered in petrol-blue leather with slim brass legs. Evening service,
warm low lighting around 2700K, no daylight. Photographic, full-frame camera,
35mm lens, natural depth of field, realistic materials, no glossy plastic look.

Wide establishing shot of the dining room, camera at seated eye height, about
120 cm from the floor. Tables set and empty, ready before service. The curved
blue ceiling slats run across the top of the frame. On the right, in the
background, the warm golden glow of the buffet counter. Calm, welcoming, a
room that looks cared for. Leave the upper left third of the frame relatively
empty and uncluttered.

Avoid: visible faces, text, signage, labels, logos, watermarks, fisheye
distortion, HDR glow, oversaturated colours, plastic-looking surfaces,
cool white Carrara marble, bright studio daylight, matte tiled floor with
visible grout lines.
```

> Lo spazio vuoto in alto a sinistra non è un vezzo: lì ci va il titolo del
> sito. Senza, il testo finisce sopra le sedie e non si legge.

## IMMAGINE 2 — Il banco carico

**16:9 · risoluzione massima · orizzontale**

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
The ceiling is covered with curved petrol-blue metal slats, each one backlit
with warm hidden light. The walls are dark charcoal marble with fine, thin,
restrained white veining, a subtle web, never big dramatic streaks and never
gold or amber veins. The floor is polished light warm-grey stone in large
seamless slabs, glossy enough to hold soft reflections of the chairs and of
the warm lights; no visible grout lines, no matte tiles, no small-format
tiling. Tables are warm light grey-beige marble, finely speckled, with a thin
brass edge only a few millimetres deep, on a slim dark base. Chairs are
upholstered in petrol-blue leather with slim brass legs. Evening service,
warm low lighting around 2700K, no daylight. Photographic, full-frame camera,
35mm lens, natural depth of field, realistic materials, no glossy plastic look.

The buffet counter seen from a three-quarter angle, generously full. Stone and
steel serving wells filled with food: steamed dumplings, grilled vegetables,
rice, noodles, sliced fresh fruit. Warm lights under the counter edge, brass
detailing on the counter front, a glass guard above. Light steam rising from
the hot section. The food looks abundant and just replenished.

Avoid: visible faces, text, signage, labels, logos, watermarks, fisheye
distortion, HDR glow, oversaturated colours, plastic-looking surfaces, empty
serving trays, minimalist single-portion plating, black studio background,
cool white Carrara marble, bright studio daylight.
```

> Tutto il sito dice «ci si serve al banco» e non c'è una sola immagine di un
> banco. È l'unico buco vero.

---

# 3. Le quattro che migliorano

## IMMAGINE 3 — La carne girata al tavolo

**16:9 · risoluzione massima · orizzontale**

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
Dark charcoal marble walls with fine thin white veining, never gold or amber.
Warm light grey-beige marble tables with a thin brass edge. Petrol-blue
leather chairs with slim brass legs. Curved petrol-blue ceiling slats backlit
with warm hidden light. Evening service, warm low lighting around 2700K, no
daylight. Photographic, full-frame camera, natural depth of field, realistic
materials, no glossy plastic look.

Close-up of a waiter carving grilled picanha from a long metal skewer onto a
plate held over a table. The knife catches the warm light, the meat has a dark
crust and a pink centre. Hands and forearms visible, face out of frame.
Shallow depth of field, the dining room softly blurred behind.

Avoid: visible faces, text, signage, labels, logos, watermarks, extra or fused
fingers, malformed hands, HDR glow, oversaturated colours, plastic-looking
surfaces, black studio background, bright studio daylight.
```

> Il momento più bello che avete: il buffet che per un attimo diventa
> servizio al tavolo. Va nel passo «Ogni tanto passiamo noi».
> **Guardate le mani al 100%**, è dove l'AI cede per prima.

## IMMAGINE 4 — Il tavolo con molti piattini

**4:3 · risoluzione massima · orizzontale**

```
A warm light grey-beige marble restaurant table, finely speckled, with a thin
brass edge a few millimetres deep. Dark charcoal marble wall behind with fine
thin white veining, never gold or amber. Petrol-blue leather chairs with slim
brass legs partly in frame. Evening service, warm low lighting around 2700K,
no daylight. Photographic, full-frame camera, natural depth of field,
realistic materials, no glossy plastic look.

The table seen from a high three-quarter angle, covered with six or seven
small plates brought back from the buffet: a few nigiri, some grilled
vegetables, steamed dumplings, a little rice, a small dessert. Glasses and
brass cutlery around them. The abundance of a shared table in the middle of
a meal, not a composed still life.

Avoid: visible faces, text, labels, logos, watermarks, HDR glow, oversaturated
colours, plastic-looking surfaces, minimalist single-portion plating, black
studio background, cool white Carrara marble, bright studio daylight.
```

> Racconta il valore: tanti assaggi, un prezzo solo. È l'immagine che manca
> di più al messaggio.

## IMMAGINE 5 — Il banco sushi durante il servizio

**16:10 · risoluzione massima · orizzontale**

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
Dark charcoal marble walls with fine thin white veining, never gold or amber.
Curved petrol-blue ceiling slats backlit with warm hidden light. Brass
detailing. Evening service, warm low lighting around 2700K, no daylight.
Photographic, full-frame camera, natural depth of field, realistic materials,
no glossy plastic look.

The sushi station during service: a dark stone counter with trays of nigiri
and maki, a chef's hands shaping rice in the background, out of focus. Warm
light from above, the blue ceiling slats reflected in the glass guard.

Avoid: visible faces, text, labels, logos, watermarks, extra or fused fingers,
malformed hands, HDR glow, oversaturated colours, plastic-looking surfaces,
empty trays, black studio background, bright studio daylight.
```

## IMMAGINE 6 — I dolci

**4:3 · risoluzione massima · orizzontale**

```
The dessert section of an all-you-can-eat buffet counter. Warm light grey-beige
marble and brass detailing, dark charcoal marble wall behind with fine thin
white veining. Warm low lighting around 2700K, no daylight. Photographic,
full-frame camera, natural depth of field, realistic materials, no glossy
plastic look.

Sliced fresh pineapple, small cakes, mochi, a bowl of chocolate, fruit cut to
order. Generous quantities, plates full and being refilled.

Avoid: text, labels, logos, watermarks, HDR glow, oversaturated colours,
plastic-looking surfaces, empty trays, minimalist single-portion plating,
black studio background, bright studio daylight.
```

---

# 4. Le tre da rifare solo se avanzano tentativi

Non spendere generazioni apposta per queste: le versioni che hai funzionano
già, hanno solo materiali che non combaciano con la sala. Vedi il controllo
di coerenza in fondo.

## IMMAGINE 7 — La sedia e il tavolo, in 16:10

Quella che hai è quadrata e ha tre materiali sbagliati.

**16:10 · risoluzione massima · orizzontale**

```
Interior of a modern all-you-can-eat buffet restaurant in Savona, Italy.
The walls are dark charcoal marble with fine, thin, restrained white veining,
a subtle web, never big dramatic streaks. The floor is polished light
warm-grey stone in large seamless slabs, glossy enough to hold soft
reflections of the chairs and of the warm lights; no visible grout lines, no
matte tiles, no small-format tiling. Tables are warm light grey-beige marble,
finely speckled, with a thin brass edge only a few millimetres deep, on a slim
dark base. Chairs are upholstered in petrol-blue leather with slim brass legs.
Evening service, warm low lighting around 2700K, no daylight. Photographic,
full-frame camera, natural depth of field, realistic materials.

Close-up detail of one dining chair and the corner of a table. The petrol-blue
leather seat and the slim brass frame fill the left half of the frame; the
marble tabletop with its thin brass edge crosses the upper right, with two
glasses and a small plate on it. Low warm light grazing the brass, the
polished floor reflecting it below.

Avoid: matte tiled floor, visible grout lines, thick sand-coloured table edge,
big dramatic marble veins, text, logos, watermarks, HDR glow, plastic-looking
surfaces, bright studio daylight.
```

## IMMAGINE 8 — Il piatto vuoto dall'alto

Quella che hai è su marmo bianco freddo, con luce da studio.

**16:9 · risoluzione massima · orizzontale**

```
Overhead flat lay on a warm light grey-beige marble restaurant table, finely
speckled, the marble of the tables of a modern buffet restaurant, not cool
white Carrara marble with strong grey veins. Warm low light around 2700K, not
bright studio daylight. Photographic, realistic materials.

An empty ceramic plate, a small sauce dish and a pair of chopsticks on their
rest, arranged in the right half of the frame. The left half is empty marble.
Soft shadows, warm reflections.

Avoid: cool white Carrara marble, strong grey veining, bright studio daylight,
flat even lighting, text, logos, watermarks, plastic-looking surfaces.
```

## IMMAGINE 9 — La salsa di soia

Quella che hai è su un piano **scuro** con venature **oro**, e contraddice il
testo del sito che dice «i tavoli sono in marmo chiaro con profili in ottone».

**16:9 · risoluzione massima · orizzontale**

```
A small ceramic dish on a warm light grey-beige marble restaurant table,
finely speckled, with a thin brass edge visible at the near border. The
veining in the marble is thin and white, never gold or amber, and the table is
light, never dark stone. Dark charcoal marble wall softly out of focus behind.
Warm low light around 2700K. Photographic, full-frame camera, shallow depth of
field, realistic materials.

Soy sauce being poured from a ceramic jug into the dish, caught mid-pour, the
liquid dark and glossy in the warm light.

Avoid: dark stone tabletop, gold or amber veining, black studio background,
text, logos, watermarks, HDR glow, plastic-looking surfaces, bright studio
daylight.
```

---

# 5. I video

## Dove vanno, e dove non vanno

Il sito ha **un solo posto pronto per un video**: l'hero. Ed è il posto
sbagliato: dietro a un titolo un video va sfocato e scurito per non
disturbare, e a quel punto non si capisce più cosa mostri.

Il posto che rende è **il passo «Ogni tanto passiamo noi»**: un riquadro
piccolo, in loop, con la carne girata. Quattro secondi nel punto esatto in cui
il testo racconta quella cosa valgono dieci volte un video decorativo a
schermo pieno, e pesano un decimo. Quel riquadro va costruito: non esiste
ancora.

## Requisiti

Orizzontale, minimo 1920×1080. Nessun audio. Camera ferma o movimento
lentissimo, nessuno stacco. Niente volti riconoscibili, niente testo.
Consegna in WebM e MP4, sotto 2 MB per file.

## VIDEO 1 — La carne girata

**Da**: immagine 3 · **4 secondi · 16:9** · niente loop, si guarda una volta

```
Very slow motion. The long knife draws once down the picanha on the skewer and
a single slice folds away and falls onto the plate. The camera does not move
at all. Warm light, the dining room blurred behind. Nothing else in the frame
moves.

Keep the exact composition, framing, lighting and objects of the source image.
Avoid: camera shake, handheld movement, zoom, pans, cuts, transitions, speed
ramps, people entering the frame, visible faces, text or captions, morphing or
warping of hands, food or objects, extra fingers, and any change to the room,
the furniture or the light.
```

## VIDEO 2 — Il vapore

**Da**: `04-vapore.png` · **4 secondi · 16:9** · **inizio = fine** per il loop

```
The steam rises and curls slowly and continuously from the bowl. The camera is
completely still. The bowl does not move. Nothing enters or leaves the frame.
Soft, even, endless movement.

Keep the exact composition, framing, lighting and objects of the source image.
Avoid: camera shake, handheld movement, zoom, pans, cuts, transitions, speed
ramps, people entering the frame, visible faces, text or captions, morphing or
warping of objects, and any change to the light.
```

> Il soggetto che si ripete meglio in assoluto: non ha inizio né fine, quindi
> il loop non si vede. Se volete comunque un video nell'hero, è questo il
> candidato giusto, non la sala.

## VIDEO 3 — Il banco, in carrellata

**Da**: immagine 2 · **durata massima · 16:9** · **inizio = fine**

```
The camera drifts very slowly sideways along the buffet counter, from left to
right, at a constant speed. Steam rises gently from the hot section. The food
does not move. No zoom, no tilt, no cuts.

Keep the exact composition, framing, lighting and objects of the source image.
Avoid: camera shake, handheld movement, zoom, cuts, transitions, speed ramps,
people entering the frame, visible faces, text or captions, morphing or
warping of food, and any change to the room or the light.
```

## VIDEO 4 — La sala

**Da**: immagine 1 · **durata massima · 16:9** · **inizio = fine**

```
Extremely slow push-in towards the dining room, a few centimetres per second.
The room is empty and still. Only the light stays alive. No people, no objects
moving, no camera shake.

Keep the exact composition, framing, lighting and objects of the source image.
Avoid: camera shake, handheld movement, zoom beyond the slow push-in, cuts,
transitions, speed ramps, people entering the frame, visible faces, text or
captions, and any change to the room, the furniture or the light.
```

> Solo se volete comunque il video nell'hero. Chiedete il movimento **più
> lento di quanto vi sembri giusto**: dietro a un titolo, un movimento
> percepibile diventa illeggibilità.

---

# 6. Cosa controllare prima di tenere una generazione

**Immagini**

- **Le mani**, al 100% e non in miniatura: dita in più, dita fuse, nocche
  impossibili. Nel primo giro una variante su quattro era da buttare.
- **Il pavimento**: deve essere lucido e riflettere, senza fughe.
- **Le venature del muro**: sottili, mai grosse e mai dorate.
- **Il testo**: qualunque scritta dentro l'immagine sarà sbagliata.
- **I riflessi sull'ottone**: se sembra plastica, si scarta.

**Video**

- Guardare **a velocità ridotta**, non a schermo intero.
- Mani e coltelli: è dove cede per prima.
- Cibo che si deforma fra un fotogramma e l'altro.
- Vapore che diventa una macchia invece di dissolversi.
- **Ultimo fotogramma contro il primo**: se sono diversi, non va in loop.

---

# 7. Riferimenti

## Dove finisce ogni immagine

| # | Immagine | Slot | Misura reale a schermo |
|---|---|---|---|
| 1 | La sala | hero della home | 1430×911, il doppio su Retina |
| 2 | Il banco | «Come funziona» | 570×357 |
| 3 | Carne girata | «Ogni tanto passiamo noi» | 570×357 |
| 4 | Tavolo con piattini | card o «La sala» | 570×357 |
| 5 | Banco sushi | «La sala» | 570×357 |
| 6 | Dolci | card | 270×202 |

Misurate nel browser a 1440 px di finestra. **Solo l'hero ha bisogno di essere
davvero grande**: per tutti gli altri slot 1280 px di lato lungo bastano già.

## Le sette che avete: cosa combacia con la sala

| Immagine | Esito | Cosa non torna |
|---|---|---|
| Marmo scuro | ✅ | è praticamente il muro della sala |
| Vapore | ✅ | fondo scuro senza contesto |
| Mani salmone | ✅ | sedie petrolio e ottone giusti sullo sfondo |
| Piatto vuoto | ⚠️ | marmo bianco freddo, luce da studio → immagine 8 |
| Nigiri | ⚠️ | stesso marmo freddo. Usabile piccola così com'è |
| Salsa di soia | ⚠️ | piano scuro e venature oro: contraddice un testo → immagine 9 |
| Sedia e tavolo | ❌ | pavimento a piastrelle, venature grosse, bordo sbagliato → immagine 7 |

Il **marmo scuro non va rigenerato**: è una texture, e va usata ripetuta a
piastrella o sotto una velatura scura. A piena nitidezza ruberebbe
l'attenzione al testo che ci sta sopra. È un fondale, non un soggetto.

## Conversione

I video vanno consegnati in WebM VP9 e MP4 H.264, sotto 2 MB per file. La
conversione richiede `ffmpeg`, che su questo computer non è installato: va
installato (è gratuito) oppure fatta altrove. Mandate pure l'originale anche
se pesa 200 MB.
