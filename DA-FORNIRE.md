# Cosa serve da te per finire il sito

> **In cima alla lista, aggiornato al 20 agosto 2026.** Tutto il resto del sito
> è stato completato: filtri pesce e carne, contatori adulti/bambini, fasce
> orarie, totale stimato, barra fissa su mobile, blocco incluso/escluso, dati
> strutturati FAQ. Restano **undici cose che solo tu puoi dirmi**, elencate qui
> sotto in ordine di urgenza.
>
> 1. **Dominio definitivo** — oggi c'è il segnaposto `www.x-sapori.it`.
>    Va messo anche in `allowed_origins` dentro `config.php`: se manca, il
>    modulo di prenotazione risponde 403 a ogni invio e il cliente legge
>    «Richiesta non consentita». Verificato: è successo davvero in prova.
> 2. **Ragione sociale, P. IVA, provider di hosting, email privacy**
> 3. **Bambini: altezza o età?** — il sito dice «sotto i 120 cm», le vecchie FAQ
>    dicevano «gratis fino a 3 anni». Ne può restare una sola
> 4. **Allergeni** — compila `ALLERGENI-DA-COMPILARE.md`: è già pronto con tutti
>    i 67 piatti e i 14 allergeni di legge, basta mettere le X
> 5. **Cinque piatti di composizione ignota** (in fondo allo stesso file)
> 6. **Quanto costa un piatto ordinato e lasciato intero** — oggi il sito dice
>    che «viene conteggiato» ma non dice quanto
> 7. **Parcheggio e distanze** — dove si parcheggia, quanti minuti a piedi dal
>    centro e dal porto
> 8. **Tre risposte**: si può portare la torta da casa? Cosa succede se si
>    arriva in ritardo? Il conto si può dividere?
> 9. **Il menu cambia?** Stagionale, piatti del giorno, pesce secondo il mercato
> 10. **Link a Google Business e social**, se attivi
> 11. **Foto e video**, quando li hai


Aggiornato al 19 agosto 2026. Ogni voce dice **dove finisce** nel sito e **che
requisiti tecnici** ha. Le voci marcate 🔴 bloccano la pubblicazione.

---

## 1. 🔴 Dati dell'attività

Servono per essere in regola e per far funzionare SEO e condivisioni.

| Dato | Dove viene usato | Stato |
|---|---|---|
| **Dominio definitivo** (es. `www.x-sapori.it`) | URL canonici, sitemap, JSON-LD, immagini social di tutte le pagine **e `allowed_origins` in `config.php`** | ⛔ ora c'è il segnaposto `www.x-sapori.it` |
| **Ragione sociale** completa | Informativa privacy §1, footer | ⛔ `[DA COMPLETARE]` |
| **Partita IVA** | Footer di ogni pagina, privacy §1 | ⛔ nel sito originale c'era `00000000000` |
| **Indirizzo email** per le richieste privacy | Privacy §1 e §6 | ⛔ ora `privacy@x-sapori.it` (allineata al dominio): la casella va creata davvero |
| **Nome del provider di hosting** | Privacy §4 (responsabile del trattamento) | ⛔ `[DA COMPLETARE]` |
| **Data di ultimo aggiornamento** della privacy | Privacy, in fondo | ⛔ `[DA COMPLETARE]` |
| **Password del pannello prenotazioni** | `/admin/` la genera al primo avvio, poi va incollata in `config.php` | ⛔ da creare |
| **Nuovo `ip_salt`** | `config.php`, protezione anti-spam | ⛔ quello attuale è finito in un file di esempio: va rigenerato (vedi `DEPLOY.md` §3) |

> L'informativa privacy è una bozza tecnica, non un documento legale.
> Falla leggere al commercialista o a un legale prima di pubblicare.

---

## 2. Fotografie

**Il sito adesso è finito e si può giudicare senza foto.** Dove andranno le
immagini ci sono tavole grafiche costruite sul motivo delle lamelle del
soffitto: non sono segnaposto vuoti, sono un elemento di design che regge da
solo. L'unica foto disponibile — la sala a 300×225 pixel — è usata in due modi
onesti: sfocata come fondale dell'hero, e incorniciata alla sua misura reale
nella sezione «La sala».

Le foto restano comunque **il salto di qualità più grande** che questo sito può
fare: un ristorante si sceglie guardando i piatti. Le tavole grafiche fanno il
loro lavoro, ma non vendono una picanha.

### Requisiti tecnici validi per tutte

- **Formato**: JPEG o HEIC direttamente dal telefono va benissimo. Alla
  conversione in AVIF/WebP e ai ritagli penso io.
- **Risoluzione minima**: lato lungo **2400 px** (qualsiasi telefono recente lo fa).
- **Non ritagliare e non applicare filtri**: mandami gli originali.
- **Orientamento**: come indicato sotto. Un verticale non può diventare un
  orizzontale senza tagliare via metà scena.
- **Luce**: quella vera del locale, la sera con le luci accese. Niente flash
  frontale: appiattisce e ingiallisce il marmo.

### Elenco degli scatti

| # | Soggetto | Formato | Dove finisce |
|---|---|---|---|
| 1 | **La sala vista d'insieme**, con il soffitto a lamelle blu ben visibile, tavoli apparecchiati, sala vuota o quasi | orizzontale 16:9 | Hero della home, a tutto schermo — **la più importante**. Oggi c'è la stessa foto sfocata: sostituendola si toglie `class="is-provvisoria"` e torna nitida |
| 2 | **Sushi**: nigiri e tartare su un piatto scuro, luce laterale | orizzontale 4:3 | Card "Sushi e tartare" |
| 3 | **Wok**: verdure saltate, meglio se con la fiamma o il vapore visibili | orizzontale 4:3 | Card "Wok e vapore" |
| 4 | **Brace**: spiedini o picanha tagliata al momento, primo piano | orizzontale 4:3 | Card "Brace e churrasco" |
| 5 | **Italiano**: un primo e la mozzarella, tavolo apparecchiato | orizzontale 4:3 | Card "Primi e mozzarella" |
| 6 | **Il banco sushi** durante il servizio, meglio con le mani del cuoco al lavoro | orizzontale 16:10 | Sezione "La sala" |
| 7 | **Dettaglio del tavolo**: profilo in ottone, marmo chiaro, bicchieri | orizzontale 16:10 | Sezione "La sala" |
| 8 | **Un tavolo di persone che mangiano** (con il loro consenso) | orizzontale 16:9 | Riserva, per la sezione "Come funziona" |

### Consigli pratici per farle bene col telefono

- Fotografa **all'altezza del tavolo**, non dall'alto in piedi: dall'alto tutto
  sembra una mensa.
- Pulisci il tavolo e togli tovaglioli sporchi, borse e telefoni dall'inquadratura.
- Per i piatti: un solo piatto a fuoco, gli altri sfocati sullo sfondo.
- La sala falla **prima dell'apertura**, con tutte le luci accese e i tavoli
  apparecchiati: sembra piena di cura invece che vuota.
- Scatta ogni soggetto **3-4 volte** da angoli diversi: scelgo io la migliore.

---

## 3. 🎬 Video per l'hero — l'impianto è già pronto

L'hero sa già ospitare un video: il codice c'è, è stato provato e aspetta
solo i file. Quando me li mandi, l'attivazione è **una riga di HTML**.

### Come funziona una volta acceso

- Il video parte **muto e in loop**, senza controlli, come sfondo del titolo.
- La fotografia resta sotto e fa da **poster**: nell'istante prima che il video
  parta non si vede mai un rettangolo nero.
- Compare in basso a destra un **pulsante di pausa** da 44 px. Non è un vezzo:
  il criterio WCAG 2.2.2 impone che un contenuto in movimento più lungo di
  cinque secondi si possa fermare. Un video in loop senza pausa è una violazione.
- Il video **non parte affatto** se: il visitatore ha attivato «riduci
  movimento», il telefono è in risparmio dati, oppure la connessione è 2G o 3G
  lenta. In quei casi resta la fotografia, che è già quella giusta.
- Se il file manca o il browser rifiuta l'autoplay, si torna alla foto senza
  lasciare buchi.

### Che cosa filmare

Un video di sfondo non deve raccontare: deve dare atmosfera dietro a un titolo.
Le riprese che funzionano hanno **un solo movimento lento** e nessun stacco.

| Soggetto | Perché funziona |
|---|---|
| **Il wok in fiamma**, ripreso di lato | movimento continuo, caldo, riconoscibile in mezzo secondo |
| **La picanha tagliata al momento**, primo piano sulla lama | è il gesto più spettacolare che avete |
| **Le mani del sushi chef** che formano un nigiri | lento, preciso, dice «fatto adesso» |
| **Il vapore che esce dal cestello di bambù** | quasi immobile: ottimo dietro al testo |
| **La sala che si riempie**, ripresa fissa in accelerato | racconta il locale senza mostrare volti |

### Requisiti tecnici

- **Orizzontale**, minimo 1920×1080. Un verticale in un hero orizzontale non ci sta.
- **6-12 secondi.** Inizio e fine simili, così il loop non ha uno scatto.
- **Nessun audio**: parte comunque muto, e l'audio è solo peso in più.
- **Camera ferma o movimento lentissimo.** Niente zoom, niente stacchi, niente
  effetti: dietro a un titolo diventano illeggibilità.
- **Niente volti riconoscibili** senza il consenso scritto delle persone.
- **Niente testo dentro al video**: non si traduce e non si legge da telefono.
- Mandatemi **l'originale**, anche se pesa 200 MB: alla conversione penso io.

### Cosa faccio io con i file

Conversione in due formati — **WebM VP9** e **MP4 H.264** — perché nessuno dei
due copre tutti i browser. Ritaglio a 16:9, estrazione del fotogramma migliore
come poster, compressione con obiettivo **sotto 2 MB per file**. Sopra quel peso
l'hero diventa più lento della pagina intera e il video fa più danni che bene.

> Se avete video **verticali** (da Instagram o TikTok) ditemelo: si possono usare,
> ma non come sfondo dell'hero. Starebbero bene in una sezione dedicata a metà
> pagina, dove il formato verticale è un vantaggio invece che un problema.

## 4. Fatti da confermare

Questi erano scritti nel sito che mi hai dato. **Non li ho inventati io, ma non
li ho potuti verificare.** Confermali o correggili: se sono falsi, vanno tolti.

- [ ] A pranzo il tavolo si tiene **90 minuti**; a cena tutta la serata.
- [ ] Sala riservata fino a **40 persone**, con **48 ore** di preavviso.
- [ ] Pagamenti: carte, bancomat, smartphone. **Buoni pasto solo a pranzo, max 2 a persona.**
- [ ] Ingresso a livello strada, sala al piano terra, corridoi larghi (accessibilità).
- [ ] Bambini **sotto i 120 cm**: 9,90 € a pranzo, 12,90 € a cena.
- [ ] Preparazioni separate per **celiaci, crostacei e frutta a guscio**, con
      preavviso di un giorno per i celiaci.
- [ ] Prezzi attuali: 14,90 / 22,90 (lun–ven) e 18,90 / 24,90 (weekend e festivi).

### Cancellato perché non verificabile e in contraddizione con il resto

Il vecchio "Chi siamo" affermava: apertura nel **2014**, **dodici anni** di
attività, **140 coperti**, **11 persone in brigata**, **3 consegne di pesce a
settimana**, ristrutturazione nel **2023**, e i cuochi **Wei**, **Hiro** e
**Lin**. La home diceva invece "nuova apertura". Ho tolto tutto: se questi dati
sono veri, dimmelo e li rimetto — con le foto delle persone vere valgono molto.

---

## 5. Facoltativo, ma alza il valore percepito

- **Recensioni reali** (Google, TripAdvisor): screenshot o testo + nome. Senza
  fonte non le metto: le recensioni inventate sono un rischio legale, oltre che
  poco serie.
- **Profilo Google Business** attivo: se lo colleghi, orari e foto compaiono
  anche nella ricerca e nelle mappe.
- **Logo**, se ne esiste uno ufficiale. Al momento ho disegnato un monogramma:
  due archi incrociati che riprendono le lamelle del soffitto.
- **Revisione madrelingua della versione inglese.** Il sito inglese esiste ed è
  completo (`/en/`), ma è tradotto da me: un madrelingua che lavori nella
  ristorazione lo migliorerebbe in mezz'ora, soprattutto sui nomi dei piatti.
- **Recensioni in inglese**, se ne avete su TripAdvisor: valgono più delle italiane
  per il pubblico dei turisti.
