# Connexion au CMS avec GitHub (e-mail + mot de passe + 2FA)

Ce guide active la connexion « **Se connecter avec GitHub** » sur `/admin`, pour que
Léana se connecte avec son compte GitHub (`leanasgr`) — **e-mail + mot de passe +
double authentification** — sans jamais coller de jeton.

Sous le capot : un petit relais PHP est déjà déployé sur OVH (`public/admin/oauth/`).
Il ne reste que des étapes à faire **sur GitHub** (5–10 min), une seule fois.

> Tant que tu n'as pas fini, **rien ne change** : la connexion actuelle par jeton
> continue de fonctionner. La bascule se fait à la toute dernière étape.

---

## 1. Donner à Léana le droit de modifier le site

1. Va sur `https://github.com/evideletang-png/ADJF` → **Settings** → **Collaborators**.
2. **Add people** → tape `leanasgr` → rôle **Write** → envoie l'invitation.
3. Léana ouvre l'e-mail d'invitation (ou `https://github.com/notifications`) et **accepte**.

## 2. Léana active la double authentification (2FA)

C'est ce qui apporte le « + 2FA » demandé. Sur le compte **de Léana** :

1. `https://github.com/settings/security` → **Two-factor authentication** → **Enable**.
2. Choisir **application d'authentification** (Google Authenticator, Authy…) et suivre les étapes.
3. **Conserver les codes de secours** proposés (en cas de perte du téléphone).

## 3. Créer l'application OAuth GitHub

Sur **ton** compte (propriétaire du dépôt) :

1. `https://github.com/settings/developers` → **OAuth Apps** → **New OAuth App**.
2. Remplir **exactement** :
   - **Application name** : `Atelier des jours fleuris — CMS`
   - **Homepage URL** : `https://www.atelierjf.fr`
   - **Authorization callback URL** : `https://www.atelierjf.fr/admin/oauth/callback`
3. **Register application**.
4. Noter le **Client ID**.
5. **Generate a new client secret** → copier le **secret** (visible une seule fois).

## 4. Enregistrer les identifiants comme secrets GitHub Actions

Sur le dépôt : `https://github.com/evideletang-png/ADJF` → **Settings** →
**Secrets and variables** → **Actions** → **New repository secret**. Créer :

| Nom du secret | Valeur |
|---|---|
| `GH_OAUTH_CLIENT_ID` | le **Client ID** de l'étape 3 |
| `GH_OAUTH_CLIENT_SECRET` | le **client secret** de l'étape 3 |

(Optionnel : `GH_OAUTH_ALLOWED_DOMAINS` — par défaut `www.atelierjf.fr,atelierjf.fr`.)

Au prochain déploiement, ces secrets génèrent tout seuls le fichier
`admin/oauth/oauth.secret.json` sur OVH (jamais dans le code public).

## 5. Activer la bascule

Dans `public/admin/config.yml`, **décommenter** la dernière ligne du bloc `backend`
(retirer le `# ` devant) :

```yaml
backend:
  name: github
  repo: evideletang-png/ADJF
  branch: main
  base_url: https://www.atelierjf.fr/admin/oauth
```

Puis **pousser sur `main`** (ou onglet **Actions** → relancer le déploiement).
Le site se redéploie tout seul (~1 min).

## 6. Vérifier

1. Ouvrir `https://www.atelierjf.fr/admin` en **navigation privée**.
2. Cliquer **« Se connecter avec GitHub »** → une fenêtre GitHub s'ouvre.
3. Se connecter avec `leanasgr` (e-mail + mot de passe + code 2FA) et **autoriser** l'app.
4. La fenêtre se ferme et l'admin s'ouvre, connecté. ✅

### En cas de souci

- **« Domaine non autorisé »** → vérifier `GH_OAUTH_ALLOWED_DOMAINS` (ou le laisser vide).
- **« Client OAuth non configuré »** → les secrets de l'étape 4 manquent ou le
  déploiement n'a pas encore tourné.
- **La fenêtre ne se ferme pas** → vérifier que l'**Authorization callback URL**
  de l'app OAuth est bien `https://www.atelierjf.fr/admin/oauth/callback`.
- Revenir en arrière : re-commenter la ligne `base_url` et pousser → retour au
  mode jeton, immédiatement.
