import process from 'node:process';

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
  '/md/',
  '/documents/',
  '/api/content/**',
  '/_nuxt/**',
  '/testimonials/**',
];

const domain = process.env.PROXY_DOMAIN ?? 'localhost';
const insecureProxy = process.env.PROXY_INSECURE;
const proxyProtocol = insecureProxy === 'true' ? 'http' : 'https';
const baseUrl = `${proxyProtocol}://${domain}`;
const referrer = insecureProxy ? baseUrl : `${baseUrl}`; // change to ${baseUrl}:443 if you get 403

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

  compatibilityDate: '2024-08-13',

  components: [{ path: '~/components', pathPrefix: false }],

  css: [],

  devtools: {
    enabled: process.env.NODE_ENV === 'development' && !(!!process.env.CI || !!process.env.TEST),
  },

  i18n: {
    defaultLocale: 'en-US',
    lazy: true,
    locales: [{ code: 'en-US', file: 'en.json', language: 'en-US' }],
    strategy: 'no_prefix',
  },

  modules: [
    '@nuxt/devtools',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    '@nuxt/test-utils/module',
    './modules/ui-library/module.ts',
    '@nuxt/image',
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
    groups: [{
      disallow: nonIndexed,
      userAgent: '*',
    }],
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
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
      isDev: process.env.NODE_ENV === 'development',
      loglevel: 3, // Setting info loglevel as the default.
      maintenance: false,
      recaptcha: {
        siteKey: '',
      },
      testing: false,
      walletConnect: {
        projectId: '',
      },
    },
  },

  site: {
    url: 'https://rotki.com',
  },

  sitemap: {
    exclude: nonIndexed,
  },
  ssr: true,
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  },
});
