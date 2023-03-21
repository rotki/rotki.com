const nonIndexed = [
  '/activation',
  '/home',
  '/maintenance',
  '/password/changed',
  '/password/send',
  '/password/reset',
  '/checkout/plan',
  '/checkout/payment-method',
  '/checkout/pay/card',
  '/checkout/pay/crypto',
  '/checkout/pay/paypal',
  '/checkout/request/crypto',
  '/account-deleted',
];

const domain = process.env.PROXY_DOMAIN || 'rotki.com';
const baseUrl = `https://${domain}`;

const proxy = {
  host: domain,
  referrer: baseUrl,
  target: `${baseUrl}/webapi`,
};

export default defineNuxtConfig({
  // Target (https://go.nuxtjs.dev/config-target)
  target: 'server',

  // Global page headers (https://go.nuxtjs.dev/config-head)
  app: {
    head: {
      title: 'rotki.com',
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
    'nuxt-vitest',
  ],

  i18n: {
    locales: [{ code: 'en', iso: 'en-US', file: 'en.json' }],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    lazy: true,
    vueI18n: {
      fallbackLocale: 'en',
    },
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
    },
  },

  sitemap: {
    siteUrl: 'https://rotki.com',
    exclude: nonIndexed,
  },

  robots: {
    UserAgent: '*',
    Disallow: () => nonIndexed,
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
  },
});
