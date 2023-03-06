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
]

export default defineNuxtConfig({
  // Target (https://go.nuxtjs.dev/config-target)
  target: 'server',

  // Global page headers (https://go.nuxtjs.dev/config-head)
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

  css: [],
  ssr: true,

  components: [{ path: '~/components', pathPrefix: false }],

  modules: [
    // '@nuxtjs/recaptcha',
    // '@nuxtjs/sitemap',
    '@nuxt/devtools',
    '@nuxtjs/robots',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    'nuxt-simple-sitemap',
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
        target: process.env.BACKEND_URL || 'https://rotki.com/webapi',
        changeOrigin: true,
        headers: {
          host: process.env.BACKEND_HOST || 'rotki.com',
          referer: process.env.BACKEND_REFERER || 'https://rotki.com',
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
        siteKey: process.env.RECAPTCHA_SITE_KEY,
      },
      baseUrl: process.env.BASE_URL || '',
      maintenance: process.env.MAINTENANCE || 'false',
      testing: process.env.TESTING,
    },
  },

  recaptcha: {
    version: 2,
  },

  sitemap: {
    hostname: 'https://rotki.com',
    exclude: nonIndexed,
  },

  robots: {
    UserAgent: '*',
    Disallow: () => nonIndexed,
  },
})
