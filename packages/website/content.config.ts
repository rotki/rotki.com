import { defineCollection, defineContentConfig, z } from '@nuxt/content';
import { defineRobotsSchema } from '@nuxtjs/robots/content';
import { defineSitemapSchema } from '@nuxtjs/sitemap/content';

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

const integrationSchema = z.object({
  slug: z.string(),
  label: z.string(),
  type: z.enum(['exchange', 'blockchain', 'protocol']),
  image: z.string(),
  tagline: z.string().optional(),
  intro: z.string(),
  // SERP/meta description (<160 chars). Kept separate from `intro` so the
  // visible intro paragraph can stay longer than the meta description allows.
  metaDescription: z.string(),
  features: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  setup: z.array(z.string()).default([]),
  screenshots: z.array(z.object({
    src: z.string(),
    alt: z.string(),
  })).default([]),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).default([]),
  keywords: z.string().optional(),
  ctaPlan: z.enum(['free', 'basic', 'advanced']).default('free'),
  isExchangeWithKey: z.boolean().optional(),
});

const comparisonSchema = z.object({
  slug: z.string(),
  competitor: z.string(),
  competitorUrl: z.string().optional(),
  image: z.string(),
  tagline: z.string(),
  intro: z.string(),
  // SERP/meta description (<160 chars). Kept separate from `intro` so the
  // visible intro paragraph can stay longer than the meta description allows.
  metaDescription: z.string(),
  keywords: z.string().optional(),
  // Short, scannable summary bullets shown near the top of the page.
  keyTakeaways: z.array(z.string()).default([]),
  // One-paragraph summary shown near the top and reused for the verdict block.
  verdict: z.string(),
  // Side-by-side table rows. rotki is always the left column. `highlight` emphasises
  // the rows that are most relevant to rotki's positioning (privacy, open source, self-custody).
  dimensions: z.array(z.object({
    label: z.string(),
    rotki: z.string(),
    competitor: z.string(),
    highlight: z.boolean().optional(),
  })).default([]),
  rotkiAdvantages: z.array(z.string()).default([]),
  // Cases where the competitor may be a better fit. Shown openly so the comparison stays balanced.
  tradeoffs: z.array(z.string()).default([]),
  // "Who rotki is for" bullets, to address switcher intent.
  whoShouldRotki: z.array(z.string()).default([]),
  // Links to relevant /integrations/<slug> pages.
  relatedIntegrations: z.array(z.object({
    slug: z.string(),
    label: z.string(),
  })).default([]),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).default([]),
  // Freshness stamp shown on the page (e.g. "Updated June 2026").
  updatedAt: z.string(),
  ctaPlan: z.enum(['free', 'basic', 'advanced']).default('free'),
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

// Feature pages are concept/use-case landing pages (e.g. "CSV import",
// "local-first crypto accounting"). Modeled on `comparisonSchema` but reshaped
// for use-case intent: no competitor/dimensions, plus capabilities/setup/troubleshooting.
const featureSchema = z.object({
  slug: z.string(),
  // Short label used in nav/cards/breadcrumb, e.g. "CSV import".
  label: z.string(),
  // Optional icon in public/img/features (svg). Index cards fall back to a glyph when absent.
  icon: z.string().optional(),
  tagline: z.string(),
  intro: z.string(),
  // SERP/meta description (<160 chars). Kept separate from `intro` so the visible
  // intro paragraph can stay longer than the meta description allows.
  metaDescription: z.string(),
  keywords: z.string().optional(),
  // Scannable "why rotki for X" bullets shown near the top.
  keyTakeaways: z.array(z.string()).default([]),
  // What rotki actually does for this use-case.
  capabilities: z.array(z.string()).default([]),
  // Honest limits / what rotki does NOT do — avoid overclaiming.
  limitations: z.array(z.string()).default([]),
  // Ordered setup steps.
  setup: z.array(z.string()).default([]),
  // Common problems and their fixes.
  troubleshooting: z.array(z.object({
    problem: z.string(),
    fix: z.string(),
  })).default([]),
  // Cross-links to /integrations/<slug>.
  relatedIntegrations: z.array(z.object({
    slug: z.string(),
    label: z.string(),
  })).default([]),
  // Cross-links to /compare/<slug>.
  relatedComparisons: z.array(z.object({
    slug: z.string(),
    label: z.string(),
  })).default([]),
  // Cross-links to other /features/<slug> pages.
  relatedFeatures: z.array(z.object({
    slug: z.string(),
    label: z.string(),
  })).default([]),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).default([]),
  // Optional deep link into the user docs (docs.rotki.com) for this use-case.
  // Rendered as a "read the documentation" link in the deep-dive section.
  docsUrl: z.string().url().optional(),
  // Freshness stamp shown on the page (e.g. "June 2026").
  updatedAt: z.string(),
  ctaPlan: z.enum(['free', 'basic', 'advanced']).default('free'),
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
