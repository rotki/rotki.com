import { defineCollection, defineContentConfig, z } from '@nuxt/content';
import { asRobotsCollection } from '@nuxtjs/robots/content';
import { asSitemapCollection } from '@nuxtjs/sitemap/content';

const DOCUMENTS = 'content/documents/*.md';
const JOBS = 'content/jobs/*.md';
const TESTIMONIALS = 'content/testimonials/*.md';
const SPONSORSHIP_TIERS = 'content/sponsorship-tiers/*.md';

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
    jobs: defineCollection(asSitemapCollection({
      schema: jobSchema,
      source: {
        cwd: '~~/',
        include: JOBS,
        prefix: 'jobs',
      },
      type: 'page',
    })),
    sponsorshipTiers: defineCollection(asRobotsCollection({
      schema: sponsorshipTierSchema,
      source: {
        cwd: '~~/',
        include: SPONSORSHIP_TIERS,
        prefix: 'sponsorship-tiers',
      },
      type: 'data',
    })),
    testimonials: defineCollection(asRobotsCollection({
      schema: testimonialSchema,
      source: {
        cwd: '~~/',
        include: TESTIMONIALS,
        prefix: 'testimonials',
      },
      type: 'page',
    })),
  },
});
