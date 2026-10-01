import type { MaybeRefOrGetter } from 'vue';
import { commonAttrs } from '~/utils/metadata';

interface PageSeoOptions {
  noIndex?: boolean;
  ogImage?: string;
  keywords?: string;
}

/**
 * Strips trailing slashes from a path, except for the root path "/".
 */
function normalizePath(path: string): string {
  return path === '/' ? path : path.replace(/\/+$/, '');
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
  const normalizedPath = normalizePath(path);
  const url = `${baseUrl}${normalizedPath}`;
  const imageUrl = `${baseUrl}/img/og/${options?.ogImage ?? 'share.png'}`;
  // Social cards don't go through the <title> template, so add the brand here when it is missing
  const socialTitle = /rotki/i.test(title) ? title : `${title} | rotki`;

  useSeoMeta({
    title,
    description,
    ogType: 'website',
    ogUrl: url,
    ogTitle: socialTitle,
    ogDescription: description,
    ogImage: imageUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: socialTitle,
    twitterDescription: description,
    twitterImage: imageUrl,
    ...(options?.noIndex && { robots: 'noindex, nofollow' }),
    ...(options?.keywords && { keywords: options.keywords }),
  });

  useHead({
    ...(!options?.noIndex && {
      link: [{ rel: 'canonical', href: url }],
    }),
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
    robots: 'noindex, nofollow',
  });

  useHead({ ...commonAttrs() });
}
