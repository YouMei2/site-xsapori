# Manutenzione del sito X-Sapori

Guida per chi gestisce il sito senza essere programmatore. Ogni operazione
dice **quale file aprire**, **cosa cercare** e **cosa non toccare**.

Serve solo un editor di testo che salvi in **UTF-8** (Blocco note di Windows va
bene, Notepad++ o VS Code sono meglio). Dopo ogni modifica, ricaricate la pagina
nel browser tenendo premuto Ctrl mentre premete F5.

> **Regola d'oro:** prima di modificare, fate una copia del file. Se qualcosa si
> rompe, rimettete la copia al suo posto e siete di nuovo in piedi.

---

## 1. Cambiare i prezzi

I prezzi compaiono in **quattro punti**. Vanno cambiati tutti, altrimenti il
sito dice una cosa e il modulo di prenotazione un'altra.

| File | Cosa cercare |
|---|---|
| `index.html` | il blocco `<dl class="prezzi">` e la riga «Bambini sotto i 120 cm» |
| `menu.html` | il blocco `<dl class="prezzi">` in fondo alla pagina |
| `prenota.html` | le quattro `<option>` dentro `<select id="formula">` e il testo `id="formula-hint"` |
| `js/booking.js` | l'elenco `ETICHETTE_FORMULA` |
| `en/…` | gli stessi punti nelle pagine inglesi (prezzi in formato `€14.90`) |

**Non cambiate mai** i codici `pranzo_feriale`, `cena_feriale`,
`pranzo_weekend`, `cena_weekend`: sono i nomi interni con cui il sito parla al
database. Cambiate solo i numeri e il testo visibile.

---

## 2. Cambiare gli orari di apertura

Gli orari sono in **cinque punti**, perché servono a cose diverse: al testo, al
riquadro «aperto ora», al modulo, a Google e alla verifica sul server.

1. `index.html` → sezione `id="dove"`, elenco `<ul class="orari">` e la riga
   `hero__meta` in alto.
2. `js/site.js` → la riga `var SERVIZI = [{ da: 12 * 60, a: 15 * 60 }, …]`.
   I numeri sono ore moltiplicate per 60: le 19:00 si scrivono `19 * 60`.
3. `js/booking.js` → il blocco `var HOURS = { … }`. Il numero davanti è il
   giorno: 1 = lunedì … 7 = domenica. Un giorno di chiusura si scrive `[]`.
4. `config.php` → il blocco `'hours' => [ … ]`, con la stessa struttura.
   **Questo è quello che conta davvero**: è il server a rifiutare le
   prenotazioni fuori orario.
5. `index.html` → il blocco `openingHoursSpecification` dentro lo script
   `application/ld+json` (è quello che legge Google).

### Chiudere per ferie o per un giorno singolo

Aggiungete la data in **due** punti, nello stesso formato `AAAA-MM-GG`:

- `config.php` → `'closed_dates' => ['2026-08-15', '2026-08-16'],`
- `js/booking.js` → `var CLOSED_DATES = ['2026-08-15', '2026-08-16'];`

Il primo blocca davvero la prenotazione, il secondo avvisa il cliente
prima che invii il modulo.

---

## 3. Aggiungere, togliere o cambiare un piatto

Aprite `menu.html` e cercate la sezione giusta (`id="sushi"`, `id="brace"`…).
Ogni piatto è una riga sola. Copiate una riga esistente e cambiate i testi:

```html
<div class="dish"><div><span class="dish__name">NOME DEL PIATTO</span><span class="dish__desc">Descrizione breve.</span></div></div>
```

Per aggiungere le etichette:

```html
<div class="dish" data-tags="veg vegano"><div><span class="dish__name">Nome</span><span class="dish__desc">Descrizione.</span></div><div class="dish__tags"><span class="tag tag--veg">Vegano</span></div></div>
```

- `data-tags` fa funzionare i filtri. Valori possibili: `veg`, `vegano`, `piccante`.
  Un piatto vegano è anche vegetariano: scrivete entrambi.
- La parte `<span class="tag …">` è l'etichetta che si **vede**. Devono
  corrispondere: se scrivete `data-tags="vegano"` mettete anche l'etichetta Vegano.

Ricordatevi di fare la stessa modifica in `en/menu.html`, in inglese.

---

## 4. Sostituire una fotografia

Le foto stanno nella cartella `uploads/`.

**Se sostituite una foto esistente**, date al file nuovo lo stesso nome del
vecchio: non serve toccare nessun altro file.

**Se aggiungete una foto dove ora c'è un segnaposto**, cercate nel file il
blocco che assomiglia a questo:

```html
<div class="ph ph--wide"><span>Foto da inserire · Selezione di nigiri…</span></div>
```

e sostituitelo con:

```html
<img src="uploads/nome-del-file.webp" alt="Descrizione di cosa si vede nella foto" width="1200" height="900" loading="lazy" decoding="async">
```

Tre cose obbligatorie:

- **`alt`**: descrivete cosa si vede. Lo leggono i non vedenti e Google.
  «Nigiri di salmone su tagliere scuro», non «foto1».
- **`width` e `height`**: i pixel reali dell'immagine. Se li omettete, la pagina
  sobbalza durante il caricamento.
- **`loading="lazy"`**: su tutte le immagini **tranne** quella grande dell'hero,
  che deve invece avere `fetchpriority="high"`.

Per il formato: mandate le foto a chi vi ha fatto il sito e fatele convertire in
WebP o AVIF. Un JPEG da telefono pesa 4 MB, la stessa foto in WebP ne pesa 300 KB
e si vede uguale.

---

## 5. Cambiare un testo

Tutti i testi sono dentro i file `.html`, in chiaro. Cercate la frase con
Ctrl+F e riscrivetela. Non toccate quello che sta dentro le parentesi angolari
`< … >`: quelle sono le istruzioni per il browser.

Le pagine sono tre: `index.html` (home), `menu.html`, `prenota.html`.
«Chi siamo» e «Contatti» non esistono più come pagine: sono sezioni della home,
cercate `id="la-sala"` e `id="dove"`.

---

## 6. Leggere le prenotazioni

Aprite `/admin/` sul vostro sito (per esempio `www.x-sapori.it/admin/`).

La prima volta chiede di creare la password: scrivetela, la pagina genera un
codice cifrato da incollare in `config.php`. Fatto quello, si entra con la
password scelta.

Nel pannello potete filtrare per data, stato e nome, segnare una prenotazione
come confermata o annullata, e scaricare tutto in CSV per aprirlo in Excel.

**Le prenotazioni non si cancellano, si annullano.** Lo storico serve se un
cliente contesta qualcosa.

---

## 7. Cosa non toccare mai

- La cartella `api/` e il file `schema.sql`: sono il motore delle prenotazioni.
- Il file `config.php`: contiene la password del database. Se lo aprite per
  cambiare orari o prezzi, cambiate **solo** i numeri, mai la struttura.
- I nomi dentro `name="…"` e `id="…"` nel modulo di `prenota.html`.
- Il file `styles.css`, a meno di non sapere cosa si sta facendo: un errore lì
  si vede su tutte le pagine contemporaneamente.

---

## 8. Se qualcosa si rompe

1. Rimettete la copia di sicurezza del file che avete modificato.
2. Se non l'avete fatta: il progetto è sotto controllo di versione con git.
   Chi vi assiste può tornare a qualsiasi versione precedente in trenta secondi.
3. Il modulo di prenotazione non funziona più? Controllate che il telefono in
   pagina sia giusto: finché il sito mostra il numero, nessun cliente è perso.
