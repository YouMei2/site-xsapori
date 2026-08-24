# Materiale di riferimento — non va pubblicato

Questi file non sono usati da nessuna pagina: servono a chi lavora al sito.
Fino al 24 agosto 2026 stavano in `uploads/`, cioe' venivano caricati via FTP
e serviti dal web insieme alle foto vere. Sessanta kilobyte di materiale
interno raggiungibili da chiunque indovinasse il nome.

| File | Cos'e' |
|---|---|
| `sala-x-sapori-originale.webp` | La fotografia vera della sala, 300x225. E' il metro di paragone per ogni immagine generata: palette, materiali, luce. Va caricata nel campo "Riferimenti immagine" del generatore, sempre. |
| `riferimento-sito-esterno.png` | Sito di un altro locale, guardato in fase di studio. |

La cartella resta nel repo perche' serve a chi lavora, ma `.htaccess` la
blocca con un 403 — anzi con due, indipendenti l'una dall'altra: la regola
`RedirectMatch` nel `.htaccess` di radice, e un `.htaccess` qui dentro con
`Require all denied`. Provate una alla volta su Apache: se per errore la
cartella finisce sull'hosting non e' raggiungibile.
Meglio comunque non copiarla via FTP.
