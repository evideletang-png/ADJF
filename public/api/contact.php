<?php
/**
 * Traitement du formulaire de contact — L'atelier des jours fleuris.
 * Envoie la demande dans la boîte OVH (SMTP authentifié) + un accusé de
 * réception au client. Les identifiants viennent de mailer.secret.json,
 * généré au déploiement depuis les secrets GitHub (jamais dans le code public).
 */

header('Content-Type: application/json; charset=utf-8');

function respond($ok, $extra = [])
{
    echo json_encode(array_merge(['ok' => $ok], $extra));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    respond(false, ['error' => 'method']);
}

// ------- Récupération des champs -------
function field($name)
{
    return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

$name       = field('name');
$email      = field('email');
$phone      = field('phone');
$type       = field('projectType') ?: 'Autre';
$eventDate  = field('eventDate');
$location   = field('location');
$budget     = field('budget');
$message    = field('message');
$consent    = field('consent');
$honeypot   = field('entreprise'); // champ piège

// ------- Anti-spam -------
// 1) Honeypot rempli -> on fait comme si tout allait bien, sans rien envoyer.
if ($honeypot !== '') {
    respond(true, ['delivered' => false]);
}
// 2) Limitation simple par IP (anti-flood léger).
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$throttleFile = sys_get_temp_dir() . '/adjf_' . md5($ip);
if (is_file($throttleFile) && (time() - filemtime($throttleFile)) < 20) {
    http_response_code(429);
    respond(false, ['error' => 'throttle']);
}
@touch($throttleFile);

// ------- Validation -------
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    respond(false, ['error' => 'invalid']);
}

// ------- Configuration SMTP (générée au déploiement) -------
$configFile = __DIR__ . '/mailer.secret.json';
if (!is_file($configFile)) {
    // Pas encore configuré : on ne bloque pas le visiteur.
    respond(true, ['delivered' => false, 'reason' => 'not_configured']);
}
$cfg = json_decode((string) file_get_contents($configFile), true);
if (!$cfg || empty($cfg['user']) || empty($cfg['pass'])) {
    respond(true, ['delivered' => false, 'reason' => 'not_configured']);
}
$host = $cfg['host'] ?? 'ssl0.ovh.net';
$port = (int) ($cfg['port'] ?? 465);
$user = $cfg['user'];
$pass = $cfg['pass'];
$to   = $cfg['to'] ?? $user;

// ------- Contenu des e-mails -------
$firstName = trim(explode(' ', $name)[0]);

$byType = [
    'Mariage'                  => "Nous préparons une proposition florale pour votre mariage et revenons vers vous sous 48 h.",
    'Événement privé'          => "Votre demande pour un événement privé est bien notée. Nous vous recontactons sous 48 h.",
    'Événement professionnel'  => "Votre demande professionnelle a été transmise. Nous revenons vers vous sous 48 h.",
    'Abonnement floral'        => "Merci ! Nous étudions votre besoin d'abonnement floral et vous répondons sous 48 h.",
    'Atelier floral'           => "Votre intérêt pour un atelier est enregistré. Nous vous envoyons les prochaines dates sous 48 h.",
    'Autre'                    => "Votre message a bien été transmis. Nous vous répondons sous 48 h.",
];
$replyIntro = $byType[$type] ?? $byType['Autre'];

// Message pour l'atelier (notification interne)
$adminSubject = "[$type] Nouvelle demande — $name";
$adminLines = [
    "Nouvelle demande depuis le site atelierjf.fr",
    "",
    "Type de projet : $type",
    "Nom           : $name",
    "Email         : $email",
    "Téléphone     : " . ($phone !== '' ? $phone : '—'),
    "Date souhaitée: " . ($eventDate !== '' ? $eventDate : '—'),
    "Lieu / ville  : " . ($location !== '' ? $location : '—'),
    "Budget        : " . ($budget !== '' ? $budget : '—'),
    "",
    "Message :",
    $message,
];
$adminBody = implode("\r\n", $adminLines);

// Accusé de réception au client
$clientSubject = "Votre demande — L'atelier des jours fleuris";
$clientLines = [
    ($firstName !== '' ? "$firstName," : 'Bonjour,'),
    '',
    $replyIntro,
    '',
    'Récapitulatif de votre demande :',
    "• Type : $type",
    ($location !== '' ? "• Lieu : $location" : null),
    ($eventDate !== '' ? "• Date : $eventDate" : null),
    '',
    'À très vite,',
    "L'atelier des jours fleuris",
    'https://www.atelierjf.fr',
];
$clientBody = implode("\r\n", array_values(array_filter($clientLines, fn($l) => $l !== null)));

// ------- Envoi SMTP -------
function smtp_dialog($fp, $expect = null)
{
    $data = '';
    while (($line = fgets($fp, 515)) !== false) {
        $data .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    if ($expect !== null && strncmp($data, (string) $expect, strlen((string) $expect)) !== 0) {
        return [false, $data];
    }
    return [true, $data];
}

function smtp_send($host, $port, $user, $pass, $from, $fromName, $to, $replyTo, $subject, $body)
{
    $transport = $port === 465 ? "ssl://$host:$port" : "tcp://$host:$port";
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
    $fp = @stream_socket_client($transport, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) {
        return [false, "connexion ($errstr)"];
    }
    stream_set_timeout($fp, 20);

    $send = function ($cmd, $expect = null) use ($fp) {
        fwrite($fp, $cmd . "\r\n");
        return smtp_dialog($fp, $expect);
    };

    smtp_dialog($fp, '220');
    $send("EHLO atelierjf.fr", '250');

    // STARTTLS si port 587
    if ($port !== 465) {
        [$ok] = $send("STARTTLS", '220');
        if (!$ok || !stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp);
            return [false, 'starttls'];
        }
        $send("EHLO atelierjf.fr", '250');
    }

    $send("AUTH LOGIN", '334');
    $send(base64_encode($user), '334');
    [$okAuth, $r] = $send(base64_encode($pass), '235');
    if (!$okAuth) {
        fclose($fp);
        return [false, 'auth'];
    }

    $send("MAIL FROM:<$from>", '250');
    [$okRcpt] = $send("RCPT TO:<$to>", '250');
    if (!$okRcpt) {
        fclose($fp);
        return [false, 'rcpt'];
    }
    [$okData] = $send("DATA", '354');
    if (!$okData) {
        fclose($fp);
        return [false, 'data'];
    }

    // En-têtes MIME (UTF-8)
    $encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
    $date = date('r');
    $headers = [
        "Date: $date",
        "From: $encFromName <$from>",
        "To: <$to>",
        "Reply-To: <$replyTo>",
        "Subject: $encSubject",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
    ];
    // Corps encodé en base64 (évite tout souci de lignes / point-stuffing)
    $payload = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body));
    fwrite($fp, $payload . "\r\n.\r\n");
    [$okSent, $resp] = smtp_dialog($fp, '250');

    $send("QUIT");
    fclose($fp);
    return [$okSent, $resp];
}

$fromName = "L'atelier des jours fleuris";

// 1) Notification à l'atelier (Reply-To = client)
[$sentAdmin, $errAdmin] = smtp_send($host, $port, $user, $pass, $user, $fromName, $to, $email, $adminSubject, $adminBody);

if (!$sentAdmin) {
    http_response_code(502);
    respond(false, ['error' => 'send', 'detail' => $errAdmin]);
}

// 2) Accusé de réception au client (on n'échoue pas le tout si celui-ci rate)
@smtp_send($host, $port, $user, $pass, $user, $fromName, $email, $user, $clientSubject, $clientBody);

respond(true, ['delivered' => true]);
