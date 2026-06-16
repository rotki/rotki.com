import type { ModuleOptions } from 'nuxt-llms';

/**
 * nuxt-llms configuration. Generates `/llms.txt`, `/llms-full.txt`, and a raw
 * markdown endpoint (`/raw/<path>.md`) for AI/LLM crawlers.
 *
 * Scope is intentionally limited to the `integrations` collection: defining a
 * section with `contentCollection` disables @nuxt/content's auto-injection of
 * all other page collections (documents, jobs, testimonials), so only the
 * integration pages are exposed. `excludeCollections` keeps the `/raw` endpoint
 * limited to integrations as well.
 *
 * @nuxt/content extends sections with `contentCollection`/`contentFilters` and
 * adds `contentRawMarkdown`, but the base nuxt-llms types don't declare them
 * (nuxt/content#3497), so we describe the shape we use here.
 */
interface ContentLlmsOptions extends ModuleOptions {
  sections: Array<ModuleOptions['sections'][number] & {
    contentCollection?: string;
    contentFilters?: Array<{ field: string; operator: string; value?: string }>;
  }>;
  contentRawMarkdown?: false | { rewriteLLMSTxt?: boolean; excludeCollections?: string[] };
}

export const llms: ContentLlmsOptions = {
  domain: 'https://rotki.com',
  title: 'rotki',
  description: 'rotki is an open-source, local-first portfolio tracker, accounting and tax tool that protects your privacy. This index covers the exchanges, blockchains, and DeFi protocols rotki integrates with.',
  full: {
    title: 'rotki integrations',
    description: 'Full setup steps, supported features, limitations, and FAQ for every exchange, blockchain, and DeFi protocol rotki integrates with.',
  },
  sections: [
    {
      title: 'Integrations',
      description: 'Exchanges, blockchains, and DeFi protocols supported by rotki. rotki runs locally and queries each source directly using your own API keys and RPC endpoints, so nothing passes through rotki-operated servers.',
      contentCollection: 'integrations',
      contentFilters: [
        { field: 'extension', operator: '=', value: 'md' },
      ],
    },
    {
      title: 'Comparisons',
      description: 'Side-by-side comparisons of rotki against popular cloud crypto tax tools. rotki is the open-source, local-first alternative: your data stays encrypted on your own machine instead of being uploaded to a vendor cloud.',
      contentCollection: 'comparisons',
      contentFilters: [
        { field: 'extension', operator: '=', value: 'md' },
      ],
    },
    {
      title: 'Features',
      description: 'Use-case and concept guides for what rotki does — CSV import, local-first accounting, privacy-first portfolio tracking, DeFi tracking, open-source crypto tax — covering capabilities, setup steps, limitations, and FAQs. rotki runs locally and reads your exchanges and chains with your own keys.',
      contentCollection: 'features',
      contentFilters: [
        { field: 'extension', operator: '=', value: 'md' },
      ],
    },
  ],
  contentRawMarkdown: {
    rewriteLLMSTxt: true,
    excludeCollections: ['documents', 'jobs', 'testimonials'],
  },
};
