import { GITHUB_CONTENT_PREFIX, LOCAL_CONTENT_PREFIX } from './utils/constants';

const nonIndexed = [
  '/activation',
  '/home',
  '/blank',
  '/maintenance',
  '/health',
  '/password/changed',
  '/password/send',
  '/password/reset',
  '/checkout/pay',
  '/checkout/pay/method',
  '/checkout/pay/card',
  '/checkout/pay/crypto',
  '/checkout/pay/paypal',
  '/checkout/pay/request-crypto',
  '/checkout/success',
  '/account-deleted',
  '/api/',
  '/md/',
  '/documents/',
  '/_nuxt/',
];

const domain = process.env.PROXY_DOMAIN || 'localhost';
const insecureProxy = process.env.PROXY_INSECURE;
const proxyProtocol = insecureProxy === 'true' ? 'http' : 'https';
const baseUrl = `${proxyProtocol}://${domain}`;
const referrer = insecureProxy ? baseUrl : `${baseUrl}:443`;

const proxy = {
  host: domain,
  referrer,
  target: `${baseUrl}/webapi`,
};

export default defineNuxtConfig({
  app: {
    head: {
      title: 'rotki.com',
      titleTemplate: '%s | rotki',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'msapplication-TileColor', content: '#00aba9' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        {
          rel: 'apple-touch-icon',
          href: '/apple-touch-icon.png',
          sizes: '180x180',
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-32x32.png',
          sizes: '32x32',
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-16x16.png',
          sizes: '16x16',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
          crossorigin: 'use-credentials',
        },
        {
          rel: 'mask-icon',
          href: '/safari-pinned-tab.svg',
          color: '#5bbad5',
        },
      ],
    },
  },

  css: [],
  ssr: true,
  site: {
    url: 'https://rotki.com',
  },

  components: [{ path: '~/components', pathPrefix: false }],

  modules: [
    '@nuxt/devtools',
    '@nuxt/content',
    '@nuxtjs/robots',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    'nuxt-simple-sitemap',
    '@nuxt/test-utils/module',
    './modules/ui-library/module.ts',
  ],

  i18n: {
    locales: [{ code: 'en', iso: 'en-US', file: 'en.json' }],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    lazy: true,
    vueI18n: './i18n.config.ts',
  },

  nitro: {
    devProxy: {
      '/webapi': {
        target: proxy.target,
        changeOrigin: true,
        headers: {
          host: proxy.host,
          referer: proxy.referrer,
        },
      },
    },
  },

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    public: {
      recaptcha: {
        siteKey: '',
      },
      baseUrl: '',
      maintenance: false,
      testing: false,
      contact: {
        emailMailto: 'mailto:info@rotki.com',
        email: 'info@rotki.com',
        supportEmail: 'support@rotki.com',
        supportEmailMailto: 'mailto:support@rotki.com',
        twitter: 'https://twitter.com/rotkiapp',
        discord: 'https://discord.rotki.com',
        github: 'https://github.com/rotki',
      },
    },
  },

  sitemap: {
    exclude: nonIndexed,
  },

  routeRules: {
    '/home/**': { index: false },
  },

  robots: {
    rules: {
      UserAgent: '*',
      Disallow: nonIndexed,
    },
  },

  content: {
    // https://content.nuxtjs.org/api/configuration
    markdown: {
      // https://content.nuxtjs.org/api/configuration#tags
      tags: {
        address: 'ProseAddress',
      },
    },
    api: {
      baseURL: '/md/_content',
    },
    sources: {
      content: {
        driver: 'fs',
        prefix: LOCAL_CONTENT_PREFIX,
        base: 'content',
      },
      github: {
        prefix: GITHUB_CONTENT_PREFIX, // Prefix for routes used to query contents
        driver: 'github', // Driver used to fetch contents
        repo: 'rotki/rotki.com',
        branch: 'main',
        dir: 'content', // Directory where contents are located. It could be a subdirectory of the repository.
      },
    },
  },
});
