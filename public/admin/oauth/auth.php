<?php
/**
 * Départ du flux OAuth : redirige l'utilisateur vers la page de connexion
 * GitHub. Appelé par le CMS à l'adresse /admin/oauth/auth?provider=github&…
 */
require __DIR__ . '/lib.php';

$cfg = oauth_config();
$provider = isset($_GET['provider']) ? (string) $_GET['provider'] : '';
$domain = isset($_GET['site_id']) ? (string) $_GET['site_id'] : '';

if ($provider === '' || !in_array($provider, SUPPORTED_PROVIDERS, true)) {
    oauth_output_html(['error' => "Ce type de dépôt n'est pas pris en charge.", 'errorCode' => 'UNSUPPORTED_BACKEND']);
}

// Liste blanche des domaines autorisés à utiliser le relais.
if (!oauth_domain_allowed($domain, $cfg['allowed_domains'] ?? '')) {
    oauth_output_html([
        'provider' => $provider,
        'error' => "Ce domaine n'est pas autorisé à utiliser l'authentification.",
        'errorCode' => 'UNSUPPORTED_DOMAIN',
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

// Jeton anti-CSRF, gardé en cookie le temps de l'aller-retour vers GitHub.
$csrf = bin2hex(random_bytes(16));
$params = http_build_query([
    'client_id' => $clientId,
    'scope' => 'repo,user',
    'state' => $csrf,
]);

header('Set-Cookie: csrf-token=github_' . $csrf . '; HttpOnly; Path=' . COOKIE_PATH . '; Max-Age=600; SameSite=Lax; Secure', false);
header('Location: https://' . $host . '/login/oauth/authorize?' . $params, true, 302);
exit;
