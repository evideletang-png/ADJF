<?php
/**
 * Relais OAuth GitHub pour Sveltia CMS — portage PHP autonome (sans dépendance)
 * du Worker officiel « sveltia-cms-auth ».
 *
 * Rôle : permettre à Léana de se connecter à /admin avec « Se connecter avec
 * GitHub » (e-mail + mot de passe + 2FA de son compte GitHub) au lieu de coller
 * un jeton. Le relais authentifie l'utilisateur auprès de GitHub puis renvoie
 * SON jeton au CMS (les commits sont donc à son nom — aucun jeton partagé).
 *
 * Les identifiants de l'app OAuth vivent dans oauth.secret.json, généré au
 * déploiement depuis les secrets GitHub Actions (jamais dans le dépôt public).
 *
 * Deux points d'entrée : auth.php (départ) et callback.php (retour de GitHub),
 * routés en URL propres /admin/oauth/auth et /admin/oauth/callback par .htaccess.
 */

const SUPPORTED_PROVIDERS = ['github'];
const COOKIE_PATH = '/admin/oauth';

/** Lit les identifiants OAuth (générés au déploiement). Tableau vide si absent. */
function oauth_config()
{
    $file = __DIR__ . '/oauth.secret.json';
    if (!is_file($file)) {
        return [];
    }
    $cfg = json_decode((string) file_get_contents($file), true);
    return is_array($cfg) ? $cfg : [];
}

/**
 * Renvoie la page HTML qui dialogue avec la fenêtre du CMS (postMessage), puis
 * arrête le script. Format du message identique au Worker officiel :
 *   authorization:<provider>:<success|error>:<json>
 */
function oauth_output_html(array $args)
{
    $provider = $args['provider'] ?? 'unknown';
    $error = $args['error'] ?? null;
    $state = $error ? 'error' : 'success';
    $content = $error
        ? ['provider' => $provider, 'error' => $error, 'errorCode' => $args['errorCode'] ?? 'ERROR']
        : ['provider' => $provider, 'token' => $args['token'] ?? ''];

    $json = json_encode($content, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $message = 'authorization:' . $provider . ':' . $state . ':' . $json;

    // Injectés comme littéraux JS via json_encode (échappement sûr).
    $messageJs = json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $expectJs = json_encode('authorizing:' . $provider);

    header('Content-Type: text/html; charset=UTF-8');
    // Efface le cookie CSRF (une fois l'échange terminé).
    header('Set-Cookie: csrf-token=deleted; HttpOnly; Max-Age=0; Path=' . COOKIE_PATH . '; SameSite=Lax; Secure', false);

    echo '<!doctype html><html><body><script>'
        . '(function(){'
        . 'window.addEventListener("message",function(e){'
        . 'if(e.data===' . $expectJs . '&&window.opener){'
        . 'window.opener.postMessage(' . $messageJs . ',e.origin);}'
        . '});'
        . 'if(window.opener){window.opener.postMessage(' . $expectJs . ',"*");}'
        . '})();'
        . '</script></body></html>';
    exit;
}

/** Vérifie que le domaine appelant (site_id) figure dans la liste blanche. */
function oauth_domain_allowed($domain, $allowed)
{
    $allowed = trim((string) $allowed);
    if ($allowed === '') {
        return true; // pas de restriction configurée
    }
    foreach (explode(',', $allowed) as $pattern) {
        $pattern = trim($pattern);
        if ($pattern === '') {
            continue;
        }
        // Échappe le motif puis autorise « * » comme joker.
        $regex = '/^' . str_replace('\*', '.+', preg_quote($pattern, '/')) . '$/';
        if (preg_match($regex, (string) $domain)) {
            return true;
        }
    }
    return false;
}

/**
 * Échange le code d'autorisation GitHub contre un jeton d'accès.
 * Retourne [token, error] (token vide en cas d'échec).
 */
function oauth_exchange_github($host, array $body)
{
    $url = 'https://' . $host . '/login/oauth/access_token';
    $payload = json_encode($body);
    $headers = ['Accept: application/json', 'Content-Type: application/json', 'User-Agent: adjf-cms-oauth'];
    $raw = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers) . "\r\n",
            'content' => $payload,
            'timeout' => 20,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $ctx);
    }

    if ($raw === false || $raw === null) {
        return ['', 'network'];
    }
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        return ['', 'malformed'];
    }
    return [(string) ($data['access_token'] ?? ''), (string) ($data['error'] ?? '')];
}
