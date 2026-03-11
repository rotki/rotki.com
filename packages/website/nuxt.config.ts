import process from 'node:process';
import rotkiTheme from '@rotki/ui-library/theme';

// Build identifier for unique chunk names per deployment
const buildId = process.env.GIT_SHA?.slice(0, 8) || Date.now();

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
  '/checkout/pay/3d-secure',
  '/checkout/pay/crypto',
  '/checkout/pay/paypal',
  '/checkout/pay/request-crypto',
  '/checkout/success',
  '/account-deleted',
  '/md/',
  '/documents/',
  '/api/**',
  '/_nuxt/**',
  '/testimonials/**',
  '/oauth/**',
];

export default defineNuxtConfig({
  hooks: {
    'build:manifest': (manifest) => {
      // Disable prefetch and modulepreload for all chunks except fonts
      // This prevents unnecessary network requests on initial page load
      // while allowing critical fonts to preload for better CLS
      for (const [key, item] of Object.entries(manifest)) {
        const isFont = key.endsWith('.woff2') || key.endsWith('.woff') || key.endsWith('.ttf');
        if (!isFont) {
          item.prefetch = false;
          item.preload = false;
          item.dynamicImports = [];
          item.imports = [];
        }
      }
    },
  },

  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'light',
        'lang': 'en',
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
        {
          href: 'https://raw.githubusercontent.com',
          rel: 'preconnect',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
        { content: '#00aba9', name: 'msapplication-TileColor' },
        { content: '#ffffff', name: 'theme-color' },
      ],
      script: [
        {
          'src': 'https://sigil.rotki.com/s.js',
          'defer': true,
          'data-website-id': 'd49a6a25-cdf7-468e-bfc2-2059867b54e0',
          'data-domains': 'rotki.com',
        },
      ],
      title: 'rotki.com',
      titleTemplate: '%s | rotki',
    },
  },

  compatibilityDate: '2025-03-01',

  future: {
    compatibilityVersion: 4,
  },

  // Disable auto-import for application components - they should be imported explicitly
  // Nuxt's built-in components (NuxtLink, NuxtPage, etc.) remain available
  components: false,

  css: [
    '~/assets/css/tailwind.css',
  ],

  devtools: {
    enabled: process.env.NODE_ENV === 'development' && !(!!process.env.CI || !!process.env.TEST),
  },

  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  i18n: {
    defaultLocale: 'en-US',
    locales: [{ code: 'en-US', file: 'en.json', language: 'en-US' }],
    strategy: 'no_prefix',
  },

  imports: {
    scan: false,
  },

  modules: [
    '@nuxt/devtools',
    '@nuxt/fonts',
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

  vite: {
    build: {
      // Disable Vite's automatic modulepreload link injection
      // Dynamic imports will still work, but won't preload dependencies
      modulePreload: { polyfill: true, resolveDependencies: () => [] },
      rollupOptions: {
        output: {
          // Include build identifier to ensure unique filenames per deployment
          // Format: _nuxt/chunkName-buildId-contentHash.js
          chunkFileNames: `_nuxt/[name]-${buildId}.[hash].js`,
          entryFileNames: `_nuxt/[name]-${buildId}.[hash].js`,
          manualChunks(id) {
            // Vite preload helper - must be in a separate small chunk that other chunks import
            // This prevents the heavy web3-appkit from being loaded just for the preload function
            if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) {
              return 'vite-helpers';
            }
            // Rollup commonjs interop helpers (virtual module \0commonjsHelpers.js)
            // These are shared across many chunks - keep them separate from heavy libs
            if (id.includes('\0commonjsHelpers')) {
              return 'commonjs-helpers';
            }
            // Heavy libraries first - order matters to prevent Vue being pulled in
            // Web3/Wallet connection - keep @reown packages together
            if (id.includes('@reown/appkit')) {
              return 'web3-appkit';
            }
            // Ethers library
            if (id.includes('node_modules/ethers')) {
              return 'ethers';
            }
            // Braintree payment SDK - split by submodule
            if (id.includes('braintree-web')) {
              if (id.includes('/client'))
                return 'braintree-client';
              if (id.includes('/three-d-secure'))
                return 'braintree-3ds';
              if (id.includes('/paypal-checkout'))
                return 'braintree-paypal';
              if (id.includes('/hosted-fields'))
                return 'braintree-hosted-fields';
              if (id.includes('/vault-manager'))
                return 'braintree-vault';
              return 'braintree-core';
            }
            // Swiper carousel - only needed on pages with carousels
            if (id.includes('swiper')) {
              return 'swiper';
            }
            // QR code generation - only needed for crypto payments
            if (id.includes('qrcode')) {
              return 'qrcode';
            }
            // Common utilities - keep separate from heavy chunks
            if (id.includes('node_modules/destr')) {
              return 'utils';
            }
            if (id.includes('node_modules/dayjs')) {
              return 'dayjs';
            }
            // Core framework - checked last so they don't end up in heavy chunks
            // Vue/VueUse/Pinia - keep together to avoid circular deps
            if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia') || id.includes('node_modules/@vueuse')) {
              return 'vue-core';
            }
          },
        },
      },
    },
  },

  nitro: {
    devProxy: {
      '/checkout/pay/card': {
        changeOrigin: true,
        target: 'http://localhost:3002/checkout/pay/card',
        ws: true,
      },
    },
    // SSG: pre-render all discoverable routes
    preset: 'static',
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },

  routeRules: {
    // Redirect /pricing to /checkout/pay
    '/pricing': { redirect: { to: '/checkout/pay', statusCode: 301 } },
    // Auth-gated routes — must not be pre-rendered (SSG has no session,
    // so middleware bakes in a meta-refresh redirect to /login).
    // Go serves the SPA fallback for these paths instead.
    '/home/**': { prerender: false },
    '/checkout/pay/method': { prerender: false },
    '/checkout/pay/paypal': { prerender: false },
    '/checkout/pay/crypto': { prerender: false },
    '/checkout/pay/request-crypto': { prerender: false },
    '/checkout/pay/3d-secure': { prerender: false },
    // Guest-only route — same problem (bakes in redirect for authenticated users)
    '/login': { prerender: false },
    // Dynamic routes — can't be pre-rendered (uid/token are dynamic)
    '/activate/**': { prerender: false },
    '/password/reset/**': { prerender: false },
  },

  runtimeConfig: {
    public: {
      baseUrl: '',
      contact: {
        discord: 'https://discord.rotki.com',
        email: 'info@rotki.com',
        emailMailto: 'mailto:info@rotki.com',
        github: 'https://github.com/rotki',
        reddit: 'https://www.reddit.com/r/rotki',
        supportEmail: 'support@rotki.com',
        supportEmailMailto: 'mailto:support@rotki.com',
        twitter: 'https://twitter.com/rotkiapp',
      },
      googleClientId: '',
      isDev: process.env.NODE_ENV === 'development',
      loglevel: 3, // Setting info loglevel as the default.
      maintenance: false,
      moneriumAuthBaseUrl: 'https://api.monerium.dev',
      moneriumAuthorizationCodeFlowClientId: '',
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

  fonts: {
    families: [
      {
        name: 'Roboto',
        provider: 'fontsource',
        weights: [400, 500, 600, 700],
        subsets: ['latin'],
      },
    ],
    defaults: {
      fallbacks: {
        'sans-serif': ['Arial', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },

  sitemap: {
    exclude: nonIndexed,
  },
  ssr: true,

  typescript: {
    tsConfig: {
      include: [
        '../vitest.config.ts',
        '../playwright.config.ts',
        '../content.config.ts',
        '../tests/**/*.ts',
        '../scripts/**/*.ts',
      ],
    },
  },

  tailwindcss: {
    config: {
      content: [
        './app/components/**/*.{vue,js,ts}',
        './app/layouts/**/*.vue',
        './app/modules/**/*.{vue,js,ts}',
        './app/pages/**/*.vue',
      ],
      darkMode: 'class',
      mode: 'jit',
      plugins: [rotkiTheme],
      theme: {
        container: {
          center: true,
        },
      },
    },
  },
});
