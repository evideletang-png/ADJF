// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL de production du site. À remplacer par le domaine définitif.
// Sert au sitemap, aux URL canoniques et aux balises Open Graph.
export default defineConfig({
  site: 'https://www.atelierdesjoursfleuris.fr',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
