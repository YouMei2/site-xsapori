# Provare la prenotazione sul proprio computer

> ## Stato al 21 agosto 2026: già fatto
>
> Questa guida descrive il percorso completo, ma **i passi 3-7 sono già stati
> eseguiti** su questo computer. XAMPP è installato, il sito è copiato in
> `C:\xampp\htdocs\x-sapori`, il database `xsapori` esiste con la tabella
> `bookings`, e la prova è passata.
>
> **Il sito è già raggiungibile qui:**
> `http://localhost:8080/x-sapori/index.html` — nota la porta **8080**.
>
> Cosa è stato verificato interrogando direttamente il server:
>
> | Prova | Esito |
> |---|---|
> | Prenotazione via API | `{"ok":true,"id":1}` in 164 ms |
> | Riga nel database | corretta, telefono normalizzato da `019 221 3138` a `0192213138` |
> | L'IP non viene salvato | nel database c'è un hash SHA-256 di 64 caratteri, non l'indirizzo |
> | Campi vuoti, data passata, ora 03:00, 99 persone, niente consenso | tutti rifiutati con 422 e messaggio in italiano |
> | Honeypot compilato | finto successo al bot, database pulito |
> | `config.php`, `schema.sql`, `.md`, `api/notify.php` | tutti 403 |
> | Intestazioni di sicurezza | CSP, X-Frame-Options, X-Content-Type-Options presenti |
> | Pannello: login, elenco, CSV, cambio stato, CSRF | tutto funzionante, e senza token il cambio stato viene rifiutato |
> | Reindirizzamenti `chi-siamo.html` e `contatti.html` | corretti dopo aver aggiunto il flag `NE` |
>
> **Resta una cosa sola, e la puoi fare solo tu:** compilare il modulo
> **nel browser** e premere invio. Il lato server è provato, il lato pagina
> anche, ma mai insieme in un unico clic. Vedi il passo 6.
>
> Il pannello è accessibile su `http://localhost:8080/x-sapori/admin/`
> con la password di prova **ff8a08087b8c** — vale solo per questa copia
> locale, il progetto vero ha il campo password vuoto.
>
> **Nota sull'email:** nel log di Apache non compare nessun errore `[notify]`,
> che per come è scritto il codice significa invio riuscito. Ma la ricezione
> non è stata verificata: quella la puoi vedere solo tu nella casella.


Guida per far girare il sito completo — PHP, database e invio email — su
Windows, senza hosting. Tempo previsto: **30-40 minuti** la prima volta.

Serve perché il modulo di prenotazione parla con `api/booking.php`, e il PHP
non è incluso in Windows. Il server di anteprima che usiamo di solito mostra
le pagine ma non esegue nulla.

---

## 1. Installare XAMPP  ✅ fatto da te

XAMPP mette insieme le tre cose che mancano: Apache (il server web), PHP e
MySQL (il database).

1. Vai su **https://www.apachefriends.org/download.html**
2. Scarica la versione **per Windows** con **PHP 8.2** (il sito richiede 8.1
   o superiore).
3. Avvia l'installatore. Windows chiederà il permesso di amministratore: è
   normale. Se l'antivirus protesta, è un falso positivo noto di XAMPP.
4. Alla schermata dei componenti puoi **togliere la spunta** a quello che non
   serve. Devono restare: **Apache**, **MySQL**, **PHP**, **phpMyAdmin**.
5. Lascia il percorso predefinito: `C:\xampp`.

---

## 2. Accendere Apache e MySQL  ✅ fatto da te (porta 8080)

Apri il **XAMPP Control Panel** (lo trovi nel menu Start) e premi **Start**
accanto a **Apache** e poi accanto a **MySQL**. Devono diventare verdi.

### Se Apache non parte

Quasi sempre è la porta 80 occupata da un altro programma. Nel Control Panel:

1. **Config** accanto ad Apache → **Apache (httpd.conf)**
2. Cerca `Listen 80` e cambialo in `Listen 8080`
3. Cerca `ServerName localhost:80` e cambialo in `ServerName localhost:8080`
4. Salva, chiudi e premi di nuovo **Start**

Se cambi porta, **in tutti gli indirizzi qui sotto** scrivi
`http://localhost:8080/...` invece di `http://localhost/...`.

---

## 3. Copiare il sito nella cartella di XAMPP  ✅ già fatto

Copia l'intera cartella del progetto dentro `C:\xampp\htdocs\`, rinominandola
`x-sapori`. Il risultato deve essere:

```
C:\xampp\htdocs\x-sapori\
├── index.html
├── config.php
├── schema.sql
├── api\
├── admin\
└── ...
```

> Se preferisci, chiedimi di farlo io: una volta installato XAMPP posso copiare
> i file al posto giusto con un comando.

---

## 4. Creare il database  ✅ già fatto

1. Apri **http://localhost:8080/phpmyadmin**
2. Colonna di sinistra → **Nuovo** (o *New*)
3. Nome del database: **`xsapori`** — scritto esattamente così, minuscolo
4. Codifica: **`utf8mb4_unicode_ci`**
5. **Crea**
6. Con `xsapori` selezionato, vai sulla scheda **Importa** (*Import*)
7. **Scegli file** → seleziona `C:\xampp\htdocs\x-sapori\schema.sql`
8. Scorri in fondo e premi **Esegui** (*Go*)

Se è andata, nella colonna di sinistra sotto `xsapori` compare la tabella
**`bookings`**.

**Non serve modificare `config.php`**: è già impostato su `localhost`, database
`xsapori`, utente `root` e password vuota, che sono i valori predefiniti di XAMPP.

---

## 5. Aprire il sito  ✅ pronto

**http://localhost:8080/x-sapori/index.html**

Da qui gira tutto come sull'hosting vero: home, menu, prenotazione, versione
inglese su `/en/`, pannello su `/admin/`.

---

## 6. La prova vera: una prenotazione  ⬅️ QUESTO TOCCA A TE

1. Vai su **http://localhost:8080/x-sapori/prenota.html**
2. Compila: una data fra qualche giorno, una fascia oraria, adulti e bambini,
   nome, cognome, telefono, e spunta il consenso privacy
3. **Invia la richiesta**

### Cosa deve succedere

| Controllo | Dove si verifica |
|---|---|
| Compare la schermata di conferma con il riepilogo | nella pagina stessa |
| Il file «aggiungi al calendario» si scarica | premi il pulsante |
| La prenotazione è nel database | phpMyAdmin → `xsapori` → `bookings` → **Mostra** |
| L'email arriva | casella `heorhiiholovashchenko@gmail.com`, **guarda anche nello spam** |

### Provare anche gli errori

Vale la pena vedere che il modulo si comporta bene quando qualcosa va storto:

- **Invia con i campi vuoti** → devono comparire gli errori in rosso sotto ogni
  campo, e il focus deve saltare al primo sbagliato.
- **Metti una data di ieri** → «Non è possibile prenotare per una data passata».
- **Metti le 03:00 come orario** → deve rifiutare: è fuori dagli orari di apertura.

---

## 7. Attivare il pannello prenotazioni  ✅ già configurato per la prova

1. Apri **http://localhost:8080/x-sapori/admin/**
2. La pagina dice che manca la password: scrivine una (almeno 10 caratteri)
3. Premi **Genera il codice** e copia il blocco che compare
4. Incollalo in `config.php` al posto di:
   ```php
   'admin' => [
       'password_hash' => '',
   ],
   ```
5. Ricarica `/admin/` ed entra con la password scelta

Dentro devi vedere la prenotazione di prova, con i filtri per data e stato e
il pulsante per scaricare il CSV.

---

## 8. Se l'email non arriva

**La prenotazione è comunque salvata**: il sito scrive prima nel database e solo
dopo prova a mandare l'email, proprio perché una casella che non funziona non
deve far perdere un cliente.

Per capire cosa è successo, apri
`C:\xampp\apache\logs\error.log` e cerca la riga che comincia con `[notify]`.

Le due cause più frequenti:

- **Il mittente non è verificato in Brevo.** In `config.php` il campo `from` è
  `emailforworkvladora@gmail.com`: quell'indirizzo deve risultare fra i mittenti
  autorizzati nel tuo account Brevo, altrimenti Brevo rifiuta l'invio. Si
  controlla in Brevo sotto *Senders* (mittenti).
- **La porta 587 è bloccata** dalla tua connessione di casa. Raro, ma capita con
  alcuni operatori. In quel caso l'invio funzionerà comunque dall'hosting.

---

## 9. Quando hai finito

1. **Cancella la prenotazione di prova**: phpMyAdmin → `xsapori` → `bookings` →
   spunta la riga → **Elimina**. Serve a non partire con dati finti.
2. Nel Control Panel premi **Stop** su Apache e MySQL.
3. XAMPP puoi lasciarlo installato: ti servirà ogni volta che vuoi provare una
   modifica prima di pubblicarla.

> **Attenzione:** questa installazione è solo per prove sul tuo computer. Non è
> raggiungibile da internet e non va usata per il sito vero. Per la
> pubblicazione vale `DEPLOY.md`.
