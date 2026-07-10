<?php
/**
 * Retour de GitHub : vérifie l'anti-CSRF, échange le code contre un jeton
 * d'accès, puis renvoie ce jeton au CMS via postMessage.
 * Adresse enregistrée dans l'app OAuth GitHub : /admin/oauth/callback
 */
require __DIR__ . '/lib.php';

$cfg = oauth_config();
$code = isset($_GET['code']) ? (string) $_GET['code'] : '';
$state = isset($_GET['state']) ? (string) $_GET['state'] : '';

// Le fournisseur + le jeton CSRF ont été mémorisés en cookie au départ.
$cookie = isset($_COOKIE['csrf-token']) ? (string) $_COOKIE['csrf-token'] : '';
if (!preg_match('/^([a-z-]+)_([0-9a-f]{32})$/', $cookie, $m)) {
    oauth_output_html(['error' => "Ce type de dépôt n'est pas pris en charge.", 'errorCode' => 'UNSUPPORTED_BACKEND']);
}
$provider = $m[1];
$csrfToken = $m[2];

if (!in_array($provider, SUPPORTED_PROVIDERS, true)) {
    oauth_output_html(['error' => "Ce type de dépôt n'est pas pris en charge.", 'errorCode' => 'UNSUPPORTED_BACKEND']);
}
if ($code === '' || $state === '') {
    oauth_output_html([
        'provider' => $provider,
        'error' => "Code d'autorisation manquant. Merci de réessayer.",
        'errorCode' => 'AUTH_CODE_REQUEST_FAILED',
    ]);
}
// Comparaison à temps constant (anti-CSRF).
if (!hash_equals($csrfToken, $state)) {
    oauth_output_html([
        'provider' => $provider,
        'error' => 'Tentative CSRF potentielle détectée. Connexion interrompue.',
        'errorCode' => 'CSRF_DETECTED',
    ]);
}

$clientId = (string) ($cfg['github_client_id'] ?? '');
$clientSecret = (string) ($cfg['github_client_secret'] ?? '');
if ($clientId === '' || $clientSecret === '') {
    oauth_output_html([
        'provider' => $provider,
        'error' => "L'identifiant ou le secret de l'app OAuth n'est pas configuré.",
        'errorCode' => 'MISCONFIGURED_CLIENT',
    ]);
}

$host = (string) ($cfg['github_hostname'] ?? 'github.com');
list($token, $err) = oauth_exchange_github($host, [
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
]);

if ($token === '') {
    oauth_output_html([
        'provider' => $provider,
        'error' => $err !== '' ? $err : "Impossible d'obtenir un jeton d'accès. Réessayez plus tard.",
        'errorCode' => 'TOKEN_REQUEST_FAILED',
    ]);
}

oauth_output_html(['provider' => $provider, 'token' => $token]);
