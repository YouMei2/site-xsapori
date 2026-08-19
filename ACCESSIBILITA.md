# Rapporto di accessibilità

Obiettivo: **WCAG 2.1 livello AA**, con i criteri aggiunti da WCAG 2.2 dove
applicabili. Verifica del 19 agosto 2026 su `index.html`, `menu.html`,
`prenota.html`, `privacy.html`, `404.html` e le quattro pagine inglesi.

**Metodo.** I contrasti non sono stimati: sono calcolati sui colori
effettivamente renderizzati dal browser, risalendo l'albero del documento fino
alla prima superficie opaca. Le dimensioni dei bersagli sono misurate sui
riquadri reali degli elementi. Lo script di verifica è `_audit.js`
(strumento di sviluppo, non va pubblicato).

---

## Problemi trovati e corretti

### 1. Bottone illeggibile nell'hero — grave

Il pulsante «Sfoglia il menu» sopra la foto della sala risultava
**1,05:1**: testo color inchiostro (`#14191C`) su fondo quasi nero (`#0E1417`).
In pratica invisibile.

**Causa.** `.hero` cambiava la proprietà `color` ma non i token semantici, così
`.btn--ghost` continuava a prendere `--on-surface` dal tema chiaro.

**Correzione.** Tutte le superfici scure (`.on-dark`, `.hero`, `.drawer`,
`.site-footer`) ora ridefiniscono l'intero blocco di token semantici. Risultato:
**15,7:1**.

### 2. Occhielli in oro sotto soglia

Il testo in oro `#8A6A2F` sul marmo alternato dava **4,38:1**, sotto il minimo
di 4,5:1 per il testo piccolo. Il token `--ottone-70` è stato scurito a
`#82632B`: **4,86:1** sul marmo alternato, **5,30:1** sul fondo principale.

### 3. Bersagli sotto i 24 px (WCAG 2.2 AA)

| Elemento | Prima | Dopo |
|---|---|---|
| Link nel pie di pagina | 21 px | 44 px |
| Casella di consenso privacy | 22 px | 24 px |
| Link nelle briciole di pane | 15 px | 28 px |
| Link «apri Google Maps» | 19 px | 32 px |
| Numeri di telefono in elenco | 20 px | 33 px |

I link **dentro una frase** restano come sono: WCAG 2.2 li esclude
esplicitamente dal requisito.

### 4. Contenuto invisibile senza JavaScript — grave

Le sezioni con comparsa allo scroll partivano con `opacity: 0`. Se il
JavaScript non fosse partito (errore di rete, blocco, browser datato), metà
sito sarebbe rimasto bianco.

**Correzione.** L'opacità iniziale si applica solo se il documento ha la classe
`.js`, aggiunta dal browser stesso. In più, se l'IntersectionObserver non
risponde entro 1,2 secondi, tutto viene mostrato comunque.

---

## Stato per criterio

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| 1.1.1 Contenuto non testuale | ✅ | Ogni immagine ha `alt` descrittivo; le 11 icone SVG decorative hanno `aria-hidden="true"`, nessuna icona resta senza indicazione |
| 1.3.1 Info e relazioni | ✅ | Un solo `h1` per pagina, nessun salto di livello, `main`/`header`/`footer` presenti, ogni `nav` con nome |
| 1.4.3 Contrasto (minimo) | ✅ | 132 elementi testuali misurati sulla home, nessuno sotto soglia dopo le correzioni |
| 1.4.4 Ridimensionamento | ✅ | Tipografia in `rem` e `clamp()`, nessun blocco dello zoom nel `viewport` |
| 1.4.10 Ridisposizione | ✅ | Nessuno scorrimento orizzontale a 375 px su tutte le pagine |
| 1.4.11 Contrasto non testuale | ✅ | L'oro è confinato a filetti e bordi decorativi; i bordi dei controlli usano `--rule-strong` |
| 2.1.1 Tastiera | ✅ | Tutti i controlli sono elementi nativi (`a`, `button`, `input`, `summary`) |
| 2.4.1 Salta blocchi | ✅ | Skip link presente su tutte le pagine, visibile al focus |
| 2.4.3 Ordine del focus | ✅ | L'ordine del DOM segue l'ordine visivo; il pannello mobile trattiene il focus e lo restituisce alla chiusura |
| 2.4.7 Focus visibile | ✅ | Contorno di 3 px con scarto di 3 px, colore diverso per tema chiaro e scuro |
| 2.5.8 Dimensione del bersaglio (2.2) | ✅ | Nessun bersaglio sotto 24 px fuori dalle eccezioni; i principali stanno sopra 44 px |
| 3.1.1 Lingua della pagina | ✅ | `lang="it"` e `lang="en"`, con `hreflang` reciproci |
| 3.3.1 Identificazione errori | ✅ | Errore sotto il campo, collegato con `aria-describedby`, più messaggio generale con `role="status"` |
| 3.3.2 Etichette o istruzioni | ✅ | 12 campi su 12 con etichetta visibile; i campi complessi hanno testo di aiuto persistente |
| 3.3.7 Reinserimento ridondante (2.2) | ✅ | Nessun dato viene richiesto due volte nel percorso di prenotazione |
| 4.1.3 Messaggi di stato (2.1) | ✅ | Filtri del menu e esito del modulo annunciati con `role="status"` e `aria-live="polite"` senza spostare il focus |
| 2.3.3 Animazione da interazione (AAA) | ✅ | `prefers-reduced-motion` disattiva ogni animazione lasciando il contenuto visibile |

---

## Cosa resta da verificare a mano

Queste cose **non sono state provate** e vanno fatte prima di dichiarare la
conformità:

1. **Screen reader reale.** Il percorso di prenotazione va percorso con NVDA
   (Windows) o VoiceOver (Mac/iOS), dall'inizio alla conferma. Le premesse
   tecniche ci sono; l'esperienza reale si giudica solo ascoltandola.
2. **Zoom al 200% e testo ingrandito.** Il layout è fluido, ma va guardato.
3. **Navigazione da tastiera in condizioni reali**, in particolare il pannello
   mobile e la fisarmonica delle domande frequenti.
4. **Le fotografie definitive**: ogni foto nuova ha bisogno del suo `alt`
   scritto a mano. Un `alt` sbagliato è peggio di un `alt` assente.
5. **Header sopra l'hero.** Lo strumento automatico segnala il testo bianco
   dell'intestazione come «basso contrasto» perché non vede l'immagine sotto:
   in realtà scorre sopra la sfumatura scura dell'hero (rgba 14,20,23 all'86%).
   Va confermato a occhio con la foto definitiva, che potrebbe essere più chiara
   di quella attuale. Sull'ultima verifica erano otto elementi, tutti di questa
   categoria: cinque link di navigazione, il marchio e due voci di contorno.

---

## Nota sulle immagini decorative

La foto dell'hero è oggi **decorativa**: è sfocata di proposito (l'originale è a
300 pixel) e non porta informazione, quindi ha `alt=""` ed è correttamente
esclusa dalla lettura vocale. Quando arriverà lo scatto ad alta risoluzione
diventerà contenuto e servirà un `alt` descrittivo — è scritto in `MANUTENZIONE.md`.

Le sei tavole grafiche che stanno al posto delle fotografie sono decorazione
pura: le quattro dentro le card hanno `aria-hidden="true"` perché la card ha già
titolo e descrizione, mentre le due della sezione «La sala» portano
un'etichetta testuale visibile che le nomina.
