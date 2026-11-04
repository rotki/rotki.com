import { useHead } from '@unhead/vue';
import { assetPaths, paths } from '@/config/paths';

/** Title, meta tags and favicons of the card payment page, written into the prerendered HTML. */
export function useCardPageHead(): void {
  useHead({
    title: 'Pay with Card - rotki',
    meta: [
      // Primary Meta Tags
      { name: 'title', content: 'Pay with Card - rotki' },
      { name: 'description', content: 'Complete your rotki premium subscription payment' },

      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: paths.appUrlBase },
      { property: 'og:title', content: 'Pay with Card - rotki' },
      { property: 'og:description', content: 'Complete your rotki premium subscription payment' },
      { property: 'og:image', content: assetPaths.hostAsset('/img/og/share.png') },

      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: paths.appUrlBase },
      { property: 'twitter:title', content: 'Pay with Card - rotki' },
      { property: 'twitter:description', content: 'Complete your rotki premium subscription payment' },
      { property: 'twitter:image', content: assetPaths.hostAsset('/img/og/share.png') },

      // Additional SEO Tags
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'author', content: 'Rotki Solutions GmbH' },
      { name: 'keywords', content: 'rotki, premium, subscription, payment, card payment, cryptocurrency accounting' },

      // Theme Color
      { name: 'theme-color', content: '#4ade80' },
    ],
    link: [
      // Favicon - app-specific favicons served from card payment path
      { rel: 'icon', type: 'image/x-icon', href: assetPaths.appAsset('favicon.ico') },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: assetPaths.appAsset('favicon-32x32.png') },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: assetPaths.appAsset('favicon-16x16.png') },
      { rel: 'apple-touch-icon', href: assetPaths.appAsset('apple-touch-icon.png') },
    ],
  });
}
