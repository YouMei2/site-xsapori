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
2. **Il chiaro è il registro dominante.** Le sezioni alternano marmo chiaro e
   sala scura. Un sito interamente scuro appiattisce la gerarchia dopo due
   schermate ed è il difetto principale della versione precedente.
3. **L'arco è il motivo grafico ricorrente**: le quattro cucine sotto l'hero,
   i divisori. Sottile, mai decorativo e basta.

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
sono l'unica cosa che i componenti possono usare. La classe `.on-dark`
ridefinisce **solo i semantici**: nessun componente va riscritto per il tema scuro.

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

## Tipografia

| Ruolo | Font | Perché |
|---|---|---|
| Display | **Fraunces** (variabile, assi opsz + wght) | serif caldo con personalità. Bodoni Moda, usato prima, è il serif "ristorante di lusso" che usano tutti |
| Testo | **Familjen Grotesk** | grotesque leggibile, non anonimo |
| Dati | **DM Mono** | prezzi, orari, occhielli, etichette: linguaggio da comanda |

Self-hostati in `assets/fonts/`, sottoinsieme latino, **104 KB in tutto**.
Nessuna chiamata a Google Fonts: prestazioni e GDPR.

Scala fluida: `--fs-display` → `--fs-micro`. Corpo del testo 17px, interlinea
1,62. Cifre tabulari su prezzi e orari, per non far ballare le colonne.

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
bottoni → dati → archi che si disegnano); `prefers-reduced-motion` disattiva
tutto e lascia il contenuto visibile.

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
