# Cosa serve da te per finire il sito

Aggiornato al 19 agosto 2026. Ogni voce dice **dove finisce** nel sito e **che
requisiti tecnici** ha. Le voci marcate 🔴 bloccano la pubblicazione.

---

## 1. 🔴 Dati dell'attività

Servono per essere in regola e per far funzionare SEO e condivisioni.

| Dato | Dove viene usato | Stato |
|---|---|---|
| **Dominio definitivo** (es. `www.x-sapori.it`) | URL canonici, sitemap, JSON-LD, immagini social di tutte le pagine | ⛔ ora c'è il segnaposto `www.x-sapori.it` |
| **Ragione sociale** completa | Informativa privacy §1, footer | ⛔ `[DA COMPLETARE]` |
| **Partita IVA** | Footer di ogni pagina, privacy §1 | ⛔ nel sito originale c'era `00000000000` |
| **Indirizzo email** per le richieste privacy | Privacy §1 e §6 | ⛔ ora `privacy@xsapori.it`: esiste davvero? |
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

## 3. Video (li hai nominati tu)

Dimmi cosa hai e li integro. Le due possibilità sensate:

1. **Video di sfondo nell'hero** (il wok in fiamma, il taglio della picanha,
   la sala che si riempie). Requisiti: orizzontale, **6-10 secondi**, senza
   audio, con un movimento lento. Lo comprimo sotto i 2 MB, parte in muto e in
   loop, si ferma con "riduci movimento" attivo e non parte mai su rete lenta.
2. **Video breve nelle card dei piatti** al passaggio del mouse. Più delicato:
   su mobile non esiste il passaggio del mouse, quindi resta una foto.

Se i video sono verticali (da Instagram o TikTok) dimmelo: cambia il modo in cui
li inserisco, perché in un hero orizzontale un verticale non ci sta.

---

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
