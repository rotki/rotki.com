import { defineCollection, defineContentConfig, z } from '@nuxt/content';
import { defineRobotsSchema } from '@nuxtjs/robots/content';
import { defineSitemapSchema } from '@nuxtjs/sitemap/content';
import { comparisonSchema, featureSchema, integrationSchema } from './shared/content-schemas';

const DOCUMENTS = 'content/documents/*.md';
const JOBS = 'content/jobs/*.md';
const TESTIMONIALS = 'content/testimonials/*.md';
const SPONSORSHIP_TIERS = 'content/sponsorship-tiers/*.md';
const INTEGRATIONS = 'content/integrations/*.md';
const COMPARISONS = 'content/comparisons/*.md';
const COMPARISON_HUB = 'content/comparison-hub/*.md';
const FEATURES = 'content/features/*.md';
const FEATURE_HUB = 'content/feature-hub/*.md';

const documentSchema = z.object({
  address: z.string().optional(),
  description: z.string(),
  subtitle: z.string().optional(),
  title: z.string(),
});

const jobSchema = z.object({
  category: z.string(),
  description: z.string(),
  open: z.boolean(),
  tags: z.array(z.string()),
  title: z.string(),
});

const testimonialSchema = z.object({
  avatar: z.string().optional(),
  order: z.number(),
  url: z.string().optional(),
  username: z.string(),
  visible: z.boolean(),
});

const sponsorshipTierSchema = z.object({
  benefits: z.string(),
  description: z.string(),
  example: z.array(z.string()).optional(),
  tier: z.enum(['bronze', 'silver', 'gold']),
});

// Hub content (intro, takeaways, shared rotki highlights, FAQ) lives in markdown so it
// is editable alongside the comparison pages rather than in i18n. Only UI labels stay in en.json.
const comparisonHubSchema = z.object({
  intro: z.string(),
  keyTakeaways: z.array(z.string()).default([]),
  rotkiHighlights: z.array(z.string()).default([]),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).default([]),
});

// Hub content (intro, takeaways, shared rotki highlights, FAQ) lives in markdown so it
// is editable alongside the feature pages rather than in i18n. Mirrors comparisonHubSchema.
const featureHubSchema = z.object({
  intro: z.string(),
  keyTakeaways: z.array(z.string()).default([]),
  rotkiHighlights: z.array(z.string()).default([]),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).default([]),
});

export default defineContentConfig({
  collections: {
    documents: defineCollection({
      schema: documentSchema,
      source: {
        cwd: '~~/',
        include: DOCUMENTS,
        prefix: 'documents',
      },
      type: 'page',
    }),
    jobs: defineCollection({
      schema: jobSchema.extend({ sitemap: defineSitemapSchema() }),
      source: {
        cwd: '~~/',
        include: JOBS,
        prefix: 'jobs',
      },
      type: 'page',
    }),
    sponsorshipTiers: defineCollection({
      schema: sponsorshipTierSchema.extend({ robots: defineRobotsSchema() }),
      source: {
        cwd: '~~/',
        include: SPONSORSHIP_TIERS,
        prefix: 'sponsorship-tiers',
      },
      type: 'data',
    }),
    testimonials: defineCollection({
      schema: testimonialSchema.extend({ robots: defineRobotsSchema() }),
      source: {
        cwd: '~~/',
        include: TESTIMONIALS,
        prefix: 'testimonials',
      },
      type: 'page',
    }),
    integrations: defineCollection({
      schema: integrationSchema.extend({ sitemap: defineSitemapSchema() }),
      source: {
        cwd: '~~/',
        include: INTEGRATIONS,
        prefix: 'integrations',
      },
      type: 'page',
    }),
    comparisons: defineCollection({
      schema: comparisonSchema.extend({ sitemap: defineSitemapSchema() }),
      source: {
        cwd: '~~/',
        include: COMPARISONS,
        // Prefix must match the page route (`/compare/<slug>`) so `queryCollection('comparisons').path(...)`
        // in compare/[slug].vue resolves; the collection name stays `comparisons`.
        prefix: 'compare',
      },
      type: 'page',
    }),
    comparisonHub: defineCollection({
      schema: comparisonHubSchema,
      source: {
        cwd: '~~/',
        include: COMPARISON_HUB,
        prefix: 'comparison-hub',
      },
      type: 'page',
    }),
    features: defineCollection({
      schema: featureSchema.extend({ sitemap: defineSitemapSchema() }),
      source: {
        cwd: '~~/',
        include: FEATURES,
        // Prefix matches the page route (`/features/<slug>`) so
        // `queryCollection('features').path(...)` in features/[slug].vue resolves.
        prefix: 'features',
      },
      type: 'page',
    }),
    featureHub: defineCollection({
      schema: featureHubSchema,
      source: {
        cwd: '~~/',
        include: FEATURE_HUB,
        prefix: 'feature-hub',
      },
      type: 'page',
    }),
  },
});
