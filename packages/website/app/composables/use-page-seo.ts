import type { MaybeRefOrGetter } from 'vue';
import { commonAttrs } from '~/utils/metadata';

interface PageSeoOptions {
  noIndex?: boolean;
  ogImage?: string;
  keywords?: string;
}

/**
 * Sets full page SEO metadata including Open Graph and Twitter tags.
 */
export function usePageSeo(
  title: string,
  description: string,
  path: string,
  options?: PageSeoOptions,
): void {
  const { public: { baseUrl } } = useRuntimeConfig();
  const url = `${baseUrl}${path}`;
  const imageUrl = `${baseUrl}/img/og/${options?.ogImage ?? 'share.png'}`;

  useSeoMeta({
    title,
    description,
    ogType: 'website',
    ogUrl: url,
    ogTitle: title,
    ogDescription: description,
    ogImage: imageUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    ...(options?.noIndex && { robots: 'noindex' }),
    ...(options?.keywords && { keywords: options.keywords }),
  });

  useHead({
    meta: [
      { property: 'twitter:url', content: url },
    ],
    ...commonAttrs(),
  });
}

/**
 * Sets minimal page metadata with noindex for private/internal pages.
 */
export function usePageSeoNoIndex(title: MaybeRefOrGetter<string>): void {
  useSeoMeta({
    title,
    robots: 'noindex',
  });

  useHead({ ...commonAttrs() });
}
