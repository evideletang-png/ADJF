// Configuration centrale du site — un seul endroit à modifier.
// (En Phase 2, ces valeurs seront éditables par Léana via le CMS.)

export const SITE = {
  name: "L'atelier des jours fleuris",
  shortName: 'Les jours fleuris',
  // Domaine de production — à ajuster (doit rester cohérent avec astro.config.mjs).
  url: 'https://www.atelierdesjoursfleuris.fr',
  tagline: 'Design floral sur mesure, sensible & de saison',
  description:
    "L'atelier des jours fleuris compose des fleurs sensibles et de saison pour les mariages, les événements privés, les événements professionnels et les abonnements floraux.",
  lang: 'fr',
  locale: 'fr_FR',
  author: 'Léana',

  // Coordonnées publiques — à compléter.
  email: 'contact@atelierdesjoursfleuris.fr',
  phone: '',
  areaServed: 'France',
  city: '',

  // Réseaux & fiche Google (avis clients branchés en Phase 3).
  instagram: 'https://www.instagram.com/',
  googleBusinessUrl: '',
} as const;

// Navigation principale.
export const NAV = [
  { label: 'Prestations', href: '/prestations' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Journal', href: '/journal' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
] as const;

// Liens légaux (bas de page).
export const LEGAL_NAV = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/confidentialite' },
] as const;
