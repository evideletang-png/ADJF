// Configuration centrale du site.
// Les réglages « contenu » (nom, coordonnées, SEO…) vivent dans
// src/data/site.json — éditables par Léana via le CMS (/admin).
import site from './data/site.json';
import ui from './data/ui.json';

export const SITE = {
  ...site,
  // Réglages techniques (non éditables au CMS)
  lang: 'fr',
  locale: 'fr_FR',
};

// Libellés d'interface (menu, pied de page, formulaire…) éditables au CMS
// via src/data/ui.json.
export const UI = ui;

// Navigation principale — libellés éditables au CMS (src/data/ui.json).
export const NAV = ui.nav;

// Liens légaux (bas de page) — éditables au CMS (src/data/ui.json).
export const LEGAL_NAV = ui.legalNav;
