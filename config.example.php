<?php
/**
 * X-Sapori Savona — esempio di configurazione.
 *
 * COME SI USA:
 *   1. Copiate questo file in config.php
 *   2. Mettete config.php UN LIVELLO SOPRA public_html (vedi README.md)
 *   3. Riempitelo con i valori veri
 *
 * config.php non finisce in git — vedi .gitignore.
 * Questo file invece ci finisce, e NON deve contenere nemmeno una
 * password o un token veri.
 */

declare(strict_types=1);

return [

    // =================================================================
    //  Pannello prenotazioni (/admin)
    // =================================================================
    // La password NON si scrive qui in chiaro: aprite /admin/ nel browser,
    // digitate la password scelta e la pagina genera il codice cifrato da
    // incollare qui sotto. Lasciando la stringa vuota il pannello mostra
    // la procedura di configurazione invece dell'accesso.
    'admin' => [
        'password_hash' => '',
    ],

    // =================================================================
    //  Base di dati
    // =================================================================
    'db' => [
        // Sull'hosting condiviso l'host e' quasi sempre localhost.
        // Aruba e qualche altro danno un host separato del tipo
        // sql.vostrodominio.it — guardate nel pannello di controllo.
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'NOME_DEL_DATABASE',
        'user'     => 'xsapori_web',
        'pass'     => 'PASSWORD_UTENTE_DATABASE',
        'charset'  => 'utf8mb4',
    ],

    // =================================================================
    //  Sale per l'impronta dell'indirizzo IP
    // =================================================================
    // Senza sale, lo SHA-256 di un IPv4 si indovina per tentativi in
    // pochi secondi: tutto lo spazio degli indirizzi sono 2^32 casi.
    // Con il sale l'impronta diventa davvero anonima.
    //
    // Si genera UNA VOLTA e non si cambia piu': cambiarlo azzera tutti
    // gli ip_hash accumulati e disattiva il limite anti-spam per dieci
    // minuti.
    //   php -r "echo bin2hex(random_bytes(32));"
    'ip_salt' => 'SOSTITUITE_CON_UNA_STRINGA_CASUALE_DI_64_CARATTERI',

    // Se fidarsi delle intestazioni del proxy per capire qual e' l'IP.
    // LASCIATE false se il sito non sta dietro Cloudflare o dietro un
    // bilanciatore. Attivarlo senza un proxy davvero davanti significa
    // che chiunque puo' falsificare X-Forwarded-For e aggirare il limite
    // anti-spam con una riga.
    'trust_proxy' => false,

    // =================================================================
    //  Domini da cui accettiamo il modulo
    // =================================================================
    // L'intestazione Access-Control-Allow-Origin non viene messa da
    // nessuna parte, quindi un JavaScript su un altro dominio non puo'
    // leggere la risposta in nessun caso. Questo elenco e' un controllo
    // in piu' su Origin e Referer.
    // Elencate tutti i modi in cui il sito si apre davvero.
    'allowed_origins' => [
        'https://x-sapori.it',
        'https://www.x-sapori.it',
        // 'http://localhost:8000',   // da togliere dal commento solo in locale
    ],

    // =================================================================
    //  Orari del ristorante
    // =================================================================
    // La chiave e' il giorno della settimana secondo ISO-8601:
    // 1 = lunedi' ... 7 = domenica.
    // Il valore e' l'elenco delle finestre [apertura, chiusura].
    // Elenco vuoto = chiuso.
    //
    // Adesso: aperto TUTTI E SETTE I GIORNI, 12:00–15:00 e 19:00–23:00.
    // Coincide con l'orario nel footer, con quello nella scheda laterale
    // di prenota.html e con openingHoursSpecification nel JSON-LD.
    // Se cambia, va cambiato in tutti e quattro i posti.
    'hours' => [
        1 => [['12:00', '15:00'], ['19:00', '23:00']],  // lunedì
        2 => [['12:00', '15:00'], ['19:00', '23:00']],  // martedì
        3 => [['12:00', '15:00'], ['19:00', '23:00']],  // mercoledì
        4 => [['12:00', '15:00'], ['19:00', '23:00']],  // giovedì
        5 => [['12:00', '15:00'], ['19:00', '23:00']],  // venerdì
        6 => [['12:00', '15:00'], ['19:00', '23:00']],  // sabato
        7 => [['12:00', '15:00'], ['19:00', '23:00']],  // domenica
    ],

    // Quanti minuti prima della chiusura si smette di far accomodare.
    // Quarantacinque: far sedere qualcuno alle 22:59 quando si chiude
    // alle 23:00 non ha senso, e il personale richiamerebbe comunque
    // per disdire.
    'last_seating_before_close' => 45,

    // CHIUSURE una tantum: ferie, giorno di pulizie, lavori.
    // Da non confondere con le festivita' qui sotto: una chiusura
    // significa che quel giorno non si accetta nessuna prenotazione.
    // Formato AAAA-MM-GG. Viene controllato prima degli orari settimanali.
    'closed_dates' => [
        // '2026-08-15',
    ],

    // =================================================================
    //  Giorni festivi
    // =================================================================
    // Nei festivi vale la tariffa del weekend, anche se cadono in
    // settimana. Formato MM-GG — si ripetono ogni anno.
    //
    // Festivita' nazionali italiane. Pasqua e Pasquetta si calcolano a
    // parte perche' la loro data si sposta: vedi 'easter_holidays'.
    'holidays' => [
        '01-01',  // Capodanno
        '01-06',  // Epifania
        '04-25',  // Festa della Liberazione
        '05-01',  // Festa del Lavoro
        '06-02',  // Festa della Repubblica
        '08-15',  // Ferragosto — Assunzione
        '11-01',  // Ognissanti
        '12-08',  // Immacolata Concezione
        '12-25',  // Natale
        '12-26',  // Santo Stefano

        // ---- festa patronale di Savona ----
        // Nostra Signora di Misericordia, patrona della citta'.
        // A Savona e' giorno non lavorativo, negozi e uffici chiusi,
        // quindi come riempimento della sala assomiglia a una domenica.
        // Se il ristorante lo considera un giorno normale, togliete
        // questa riga.
        '03-18',  // Patrona di Savona
    ],

    // Se considerare festivi anche Pasqua e Pasquetta.
    // La data si calcola con l'algoritmo gregoriano, non serve nessuna
    // tabella. Pasqua cade sempre di domenica, quindi in pratica questa
    // riga serve per il Lunedì dell'Angelo.
    'easter_holidays' => true,

    // Festivita' una tantum legate a un anno preciso: eventi locali,
    // ponti, feste cittadine. Formato AAAA-MM-GG.
    // Il ristorante e' aperto, ma vale la tariffa del weekend.
    'holidays_extra' => [
        // '2027-05-24',
    ],

    // =================================================================
    //  Limiti della prenotazione
    // =================================================================
    'min_guests'         => 1,
    'max_guests'         => 40,   // uguale al max in prenota.html e al testo della scheda laterale
    'max_months_ahead'   => 6,    // oltre sei mesi non si accetta
    'min_minutes_ahead'  => 30,   // per oggi, non prima di mezz'ora da adesso

    // Valori ammessi nei campi a tendina.
    // Devono coincidere con gli ENUM in schema.sql e con i
    // <option value> in prenota.html.
    'formulas'  => ['pranzo_feriale', 'cena_feriale', 'pranzo_weekend', 'cena_weekend'],
    'occasions' => ['nessuna', 'compleanno', 'gruppo', 'famiglia', 'altro'],

    // =================================================================
    //  Anti-spam
    // =================================================================
    'rate_limit' => [
        'max_requests' => 3,    // non piu' di 3 richieste
        'window_min'   => 10,   // ogni 10 minuti
    ],

    // Nome del campo trappola nascosto. Deve coincidere con il name in
    // prenota.html. Il nome sembra apposta un campo vero: i bot
    // riempiono tutto quello che assomiglia a un indirizzo o a un sito.
    'honeypot_field' => 'indirizzo_web',

    // =================================================================
    //  Avvisi al personale via email
    // =================================================================
    // Telegram non si usa, ed e' una scelta: manderebbe nomi e numeri
    // di telefono dei clienti fuori dallo Spazio economico europeo, e
    // andrebbe descritto a parte nella privacy.
    'mail' => [
        'enabled' => true,

        // Destinatari. A ognuno parte una mail separata: gli indirizzi
        // non si vedono fra loro, e se uno rimbalza non trascina gli altri.
        'to' => [
            'prenotazioni@x-sapori.it',
            // 'cucina@x-sapori.it',
        ],

        // Il From DEVE stare sul vostro dominio. Una mail spedita da un
        // indirizzo altrui non passa il controllo SPF/DMARC di chi la
        // riceve e finisce nello spam.
        'from'      => 'no-reply@x-sapori.it',
        'from_name' => 'Sito X-Sapori',

        // Se mettere il Reply-To sull'email del cliente, quando l'ha
        // lasciata. Cosi' il personale schiaccia «Rispondi» e scrive
        // direttamente a lui.
        'reply_to_guest' => true,

        // Se mandare al cliente una mail che dice che la richiesta e'
        // arrivata. Parte solo a chi ha lasciato l'email, che e' un
        // campo facoltativo.
        //
        // E' la conferma che la RICHIESTA e' arrivata, non che il tavolo
        // e' prenotato: il tavolo lo conferma il personale al telefono, e
        // nella mail c'e' scritto in un riquadro in evidenza. Non
        // cambiate quelle parole in «prenotazione confermata», o il
        // cliente si presenta per un tavolo che non esiste.
        'guest_confirmation' => true,

        // -----------------------------------------------------------
        //  Trasporto: 'mail' oppure 'smtp'
        // -----------------------------------------------------------
        // 'mail' — la funzione interna di PHP. Non c'e' niente da
        //          configurare, ma sull'hosting condiviso le mail
        //          finiscono spesso nello spam, e a volte mail() e'
        //          proprio disattivata.
        // 'smtp' — collegamento diretto alla casella del vostro dominio.
        //          Cinque minuti in piu' da impostare, e una consegna
        //          incomparabilmente migliore. CONSIGLIATO.
        'transport' => 'mail',

        // Solo per transport='mail'.
        // Passa -f a sendmail, cioe' imposta il mittente di busta. Senza,
        // l'hosting ci mette l'indirizzo dell'utente di sistema, del tipo
        // www-data@srv123.hosting.it, e il controllo SPF fallisce.
        // Se l'hosting vieta -f (le mail smettono di partire), mettete
        // false.
        'envelope_sender' => true,

        // Solo per transport='smtp'.
        // I dati stanno nel pannello dell'hosting, sezione «Posta»: sono
        // gli stessi che si scrivono nel programma di posta del telefono.
        'smtp' => [
            'host'   => '',        // es. smtps.aruba.it, mail.vostrodominio.it
            'port'   => 587,       // 587 per TLS/STARTTLS, 465 per SSL
            'secure' => 'tls',     // 'tls' | 'ssl' | '' (senza cifratura: da evitare)
            'user'   => '',        // di solito l'indirizzo intero: no-reply@x-sapori.it
            'pass'   => '',        // password della casella di posta
            'timeout' => 8,        // secondi per tutta la sessione

            // Controllo del certificato TLS del server. Da disattivare
            // solo se l'hosting usa un certificato autofirmato: senza,
            // la cifratura non protegge dalla sostituzione del server.
            'verify_peer' => true,
        ],
    ],

    // =================================================================
    //  Diagnostica
    // =================================================================
    // SOLO per lo sviluppo in locale. Sul server vero rigorosamente
    // false: con true nella risposta JSON finiscono i testi degli
    // errori di PDO.
    'debug' => false,
];
