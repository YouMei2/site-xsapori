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
with warm hidden light. The walls are dark charcoal marble with fine white
veining. Tables are light warm marble with a thin brass edge. Chairs are
upholstered in petrol-blue leather with slim brass legs. Polished light
stone floor. Evening service, warm low lighting around 2700K, no daylight.
Photographic, full-frame camera, 35mm lens, natural depth of field,
realistic materials, no glossy plastic look.
```

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
