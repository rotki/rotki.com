import process from 'node:process';
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
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
        },
        { href: '/favicon.ico', rel: 'icon', type: 'image/x-icon' },
        {
          href: '/favicon-32x32.png',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          href: '/favicon-16x16.png',
          rel: 'icon',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          crossorigin: 'use-credentials',
          href: '/site.webmanifest',
          rel: 'manifest',
        },
        {
          color: '#5bbad5',
          href: '/safari-pinned-tab.svg',
          rel: 'mask-icon',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
        { content: '#00aba9', name: 'msapplication-TileColor' },
        { content: '#ffffff', name: 'theme-color' },
      ],
      title: 'rotki.com',
      titleTemplate: '%s | rotki',
    },
  },

  components: [{ path: '~/components', pathPrefix: false }],
  content: {
    api: {
      baseURL: '/md/_content',
    },
    // https://content.nuxtjs.org/api/configuration
    markdown: {
      // https://content.nuxtjs.org/api/configuration#tags
      tags: {
        address: 'ProseAddress',
      },
    },
    sources: {
      content: {
        base: 'content',
        driver: 'fs',
        prefix: LOCAL_CONTENT_PREFIX,
      },
      github: {
        branch: 'main',
        dir: 'content', // Directory where contents are located. It could be a subdirectory of the repository.
        driver: 'github', // Driver used to fetch contents
        prefix: GITHUB_CONTENT_PREFIX, // Prefix for routes used to query contents
        repo: 'rotki/rotki.com',
      },
    },
  },
  css: [],

  devtools: {
    enabled: !!process.env.CI || !!process.env.TEST,
  },

  i18n: {
    defaultLocale: 'en',
    langDir: 'locales',
    lazy: true,
    locales: [{ code: 'en', file: 'en.json', iso: 'en-US' }],
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts',
  },

  modules: [
    '@nuxt/devtools',
    '@nuxt/content',
    '@nuxtjs/robots',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    '@nuxtjs/sitemap',
    '@nuxt/test-utils/module',
    './modules/ui-library/module.ts',
  ],

  nitro: {
    devProxy: {
      '/webapi': {
        changeOrigin: true,
        headers: {
          host: proxy.host,
          origin: proxy.referrer,
          referer: proxy.referrer,
        },
        target: proxy.target,
      },
    },
  },

  robots: {
    rules: {
      Disallow: nonIndexed,
      UserAgent: '*',
    },
  },

  routeRules: {
    '/home/**': { index: false },
  },

  runtimeConfig: {
    public: {
      baseUrl: '',
      contact: {
        discord: 'https://discord.rotki.com',
        email: 'info@rotki.com',
        emailMailto: 'mailto:info@rotki.com',
        github: 'https://github.com/rotki',
        supportEmail: 'support@rotki.com',
        supportEmailMailto: 'mailto:support@rotki.com',
        twitter: 'https://twitter.com/rotkiapp',
      },
      isDev: process.env.NODE_ENV === 'development',
      loglevel: 3, // Setting info loglevel as the default.
      maintenance: false,
      recaptcha: {
        siteKey: '',
      },
      testing: false,
    },
  },

  site: {
    url: 'https://rotki.com',
  },

  sitemap: {
    exclude: nonIndexed,
  },

  ssr: true,
});
