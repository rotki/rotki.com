import { type CollectionSource, defineCollection, defineContentConfig, type DefinedCollection, z } from '@nuxt/content';
import { asRobotsCollection } from '@nuxtjs/robots/content';
import { asSitemapCollection } from '@nuxtjs/sitemap/content';

const DOCUMENTS = 'content/documents/*.md';
const JOBS = 'content/jobs/*.md';
const TESTIMONIALS = 'content/testimonials/*.md';
const SPONSORSHIP_TIERS = 'content/sponsorship-tiers/*.md';

function getSource(path: string, dataOrigin: 'remote' | 'local'): CollectionSource {
  if (dataOrigin === 'remote') {
    return {
      include: path,
      prefix: path.split('/')[1],
      repository: 'https://github.com/rotki/rotki.com',
    };
  }
  else {
    return {
      cwd: '~~/',
      include: path,
      prefix: path.split('/')[1],
    };
  }
}

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

function getDocumentsCollection(dataOrigin: 'remote' | 'local'): DefinedCollection {
  return defineCollection({
    schema: documentSchema,
    source: getSource(DOCUMENTS, dataOrigin),
    type: 'page',
  });
}

function getJobsCollection(dataOrigin: 'remote' | 'local'): DefinedCollection {
  return defineCollection(asSitemapCollection({
    schema: jobSchema,
    source: getSource(JOBS, dataOrigin),
    type: 'page',
  }));
}

function getTestimonialsCollection(dataOrigin: 'remote' | 'local'): DefinedCollection {
  return defineCollection(asRobotsCollection({
    schema: testimonialSchema,
    source: getSource(TESTIMONIALS, dataOrigin),
    type: 'page',
  }));
}

function getSponsorshipTiersCollection(dataOrigin: 'remote' | 'local'): DefinedCollection {
  return defineCollection(asRobotsCollection({
    schema: sponsorshipTierSchema,
    source: getSource(SPONSORSHIP_TIERS, dataOrigin),
    type: 'data',
  }));
}

export default defineContentConfig({
  collections: {
    documentsLocal: getDocumentsCollection('local'),
    documentsRemote: getDocumentsCollection('remote'),
    jobsLocal: getJobsCollection('local'),
    jobsRemote: getJobsCollection('remote'),
    sponsorshipTiersLocal: getSponsorshipTiersCollection('local'),
    sponsorshipTiersRemote: getSponsorshipTiersCollection('remote'),
    testimonialsLocal: getTestimonialsCollection('local'),
    testimonialsRemote: getTestimonialsCollection('remote'),
  },
});
