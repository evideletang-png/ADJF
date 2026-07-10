import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Palette de visuels disponibles pour les marque-places (voir global.css).
const variant = z
  .enum(['', 'iris', 'ochre', 'sky', 'rose'])
  .default('');

const faq = z
  .array(z.object({ q: z.string(), a: z.string() }))
  .default([]);

// Journal / blog — articles en Markdown, éditables (CMS en Phase 2).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('Conseil'),
    readingTime: z.string().optional(),
    variant,
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    keyword: z.string().optional(),
    faq,
    draft: z.boolean().default(false),
  }),
});

// Prestations — une fiche par offre.
const prestations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prestations' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]),
    variant,
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    priceFrom: z.string().optional(),
    faq,
    draft: z.boolean().default(false),
  }),
});

// Réalisations — un projet par fiche, regroupés par catégorie sur la page.
const realisations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/realisations' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number().default(0),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    gallery: z
      .array(z.object({ image: z.string().optional(), alt: z.string().optional() }))
      .default([]),
    variant,
    draft: z.boolean().default(false),
  }),
});

// Pages légales — éditables au CMS.
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { blog, prestations, realisations, legal };
