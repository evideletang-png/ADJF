// Configuration centrale du site.
// Les réglages « contenu » (nom, coordonnées, SEO…) vivent dans
// src/data/site.json — éditables par Léana via le CMS (/admin).
import site from './data/site.json';

export const SITE = {
  ...site,
  // Réglages techniques (non éditables au CMS)
  lang: 'fr',
  locale: 'fr_FR',
};

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
