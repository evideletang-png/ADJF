# L'atelier des jours fleuris

Site vitrine d'une fleuriste événementielle — mariages, événements privés et
professionnels, abonnements floraux et ateliers. Construit avec **Astro** :
statique, rapide, optimisé pour le référencement.

> Refonte réalisée dans l'esprit épuré et poétique d'un herbier moderne.
> L'ancienne application de facturation a été retirée : ce dépôt ne contient plus
> que le site vitrine.

## Démarrer

```bash
npm install       # installer les dépendances
npm run dev       # serveur de développement (http://localhost:4321)
npm run build     # générer le site statique dans dist/
npm run preview   # prévisualiser le build de production
```

Node ≥ 22.12 requis.

## Structure

```
src/
  consts.ts              # ⚙️ Configuration centrale (nom, domaine, email, réseaux…)
  styles/global.css      # Design system (couleurs, typo, thèmes clair/sombre)
  layouts/BaseLayout.astro
  components/             # Header, Footer, SEO, Carousel, Hero, cartes, avis, formulaire
  content/
    prestations/*.md      # 📝 Fiches prestations (éditables)
    blog/*.md             # 📝 Articles du journal (éditables)
  content.config.ts      # Schémas des collections de contenu
  pages/                 # Pages du site (routage par fichier)
public/                  # logo.jpg, robots.txt, llms.txt
```

## Modifier le contenu

- **Prestations** : ajouter/éditer un fichier dans `src/content/prestations/`.
- **Articles** : ajouter/éditer un fichier dans `src/content/blog/`.
- **Coordonnées, domaine, réseaux, zone desservie** : `src/consts.ts`.

Chaque fichier Markdown commence par un bloc « frontmatter » (titre, description,
date, FAQ…). Astuce : si une valeur contient « : » (deux-points), placez-la entre
guillemets `"…"`.

> En **Phase 2**, une interface d'administration `/admin` (CMS) permettra d'éditer
> ces contenus sans toucher au code.

## SEO & GEO (déjà en place)

- Sitemap XML (`/sitemap-index.xml`) et `robots.txt`.
- Balises `title`/`description`, URL canoniques, Open Graph & Twitter Cards par page.
- Données structurées JSON-LD : `Florist`, `WebSite`, `Service`, `BlogPosting`,
  `FAQPage`, `BreadcrumbList`.
- Flux RSS du journal (`/rss.xml`).
- `llms.txt` pour les moteurs de réponse IA (GEO).
- Thèmes clair/sombre, responsive mobile-first, accessibilité (focus, skip-link,
  `prefers-reduced-motion`).

## À brancher (Phase 3)

Ces deux fonctionnalités sont pour l'instant en **maquette fonctionnelle** :

- **Formulaire de contact → Gmail.** `src/components/ContactForm.astro` valide et
  affiche une confirmation personnalisée. Il reste à créer une fonction serverless
  (`/api/contact`) qui envoie via l'API Gmail (classement par type de projet,
  libellé, accusé de réception, brouillon de réponse).
- **Avis Google.** `src/components/Reviews.astro` affiche des avis d'exemple. À
  connecter à l'API Google Places (récupération côté serveur + cache) et à émettre
  la donnée `AggregateRating`. Renseigner `googleBusinessUrl` dans `consts.ts`.

## Déploiement

Site statique : déployable sur **Netlify** ou **Cloudflare Pages** (offre gratuite,
HTTPS, déploiement automatique). Pensez à mettre à jour le domaine dans
`astro.config.mjs` (`site`) et `src/consts.ts`.

## Feuille de route

1. **Fondations** ✅ — refonte, design system, pages, responsive, SEO de base.
2. **Contenu** — CMS `/admin`, portfolio à carrousels par réalisation.
3. **Connexions** — formulaire Gmail, avis Google, GEO avancé, analytics.
4. **Finitions** — performance, accessibilité, vraies photos & textes.
