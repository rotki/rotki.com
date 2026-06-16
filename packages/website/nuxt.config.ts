import process from 'node:process';
import { SIGIL_SCRIPT_URL, SIGIL_TRACKED_DOMAIN, SIGIL_WEBSITE_ID } from '@rotki/sigil';
import rotkiTheme from '@rotki/ui-library/theme';
import { comparisonPrerenderRoutes } from './app/utils/comparison-prerender';
import { featurePrerenderRoutes } from './app/utils/feature-prerender';
import { integrationPrerenderRoutes } from './app/utils/integration-prerender';
import { llms } from './app/utils/llms-config';

// Build identifier for unique chunk names per deployment
const buildId = process.env.GIT_SHA?.slice(0, 8) || Date.now();

const nonIndexed = [
  '/activation',
  '/home/**',
  '/maintenance',
  '/health',
  '/login',
  '/logout',
  '/signup',
  '/activate/**',
  '/password/**',
  '/checkout/pay/method',
  '/checkout/pay/card',
  '/checkout/pay/3d-secure',
  '/checkout/pay/crypto',
  '/checkout/pay/paypal',
  '/checkout/pay/request-crypto',
  '/checkout/success',
  '/account-deleted',
  '/sponsor/submit-name',
  '/md/',
  '/documents/',
  '/api/**',
  '/_nuxt/**',
  '/testimonials/**',
  '/oauth/**',
  '/auth/**',
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
          'src': SIGIL_SCRIPT_URL,
          'defer': true,
          'data-website-id': SIGIL_WEBSITE_ID,
          'data-domains': SIGIL_TRACKED_DOMAIN,
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
    'nuxt-llms',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    '@nuxt/test-utils/module',
    './modules/integration-images/module.ts',
    './modules/integration-seo/module.ts',
    './modules/comparison-seo/module.ts',
    './modules/feature-seo/module.ts',
    './modules/ui-library/module.ts',
  ],

  vite: {
    // Pre-bundle deps Vite's startup scan misses (subpath/deep imports), so the
    // dev server doesn't discover them mid-session and trigger a full reload.
    // Dev-only: has no effect on the production build. Covers heavy
    // route-specific libs (web3/payments) too, at the cost of a slower dev
    // cold-start.
    optimizeDeps: {
      include: [
        '@rotki/ui-library',
        '@rotki/ui-library/components',
        '@rotki/ui-library/composables',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vuelidate/core',
        '@vuelidate/validators',
        'zod',
        'swiper/vue',
        'swiper/modules',
        'qrcode',
        'ethers',
        'ethers/address',
        'ethers/constants',
        'ethers/contract',
        'ethers/providers',
        'ethers/utils',
        '@reown/appkit',
        '@reown/appkit/vue',
        '@reown/appkit/networks',
        '@reown/appkit-adapter-ethers',
        '@reown/appkit-controllers',
        'braintree-web',
        'braintree-web/client',
        'braintree-web/hosted-fields',
        'braintree-web/three-d-secure',
      ],
    },
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
      // Guardrail: fail the build if an indexable route errors while rendering — make it ssr:false instead.
      failOnError: true,
      routes: [...integrationPrerenderRoutes(), ...comparisonPrerenderRoutes(), ...featurePrerenderRoutes()],
    },
  },
  routeRules: {
    // Redirect /pricing to /checkout/pay
    '/pricing': { redirect: { to: '/checkout/pay', statusCode: 301 } },
    // Client-only routes: `ssr: false` keeps them SPA in BOTH dev and build (so
    // dev matches the production 200.html SPA fallback — no session/redirect is
    // ever server-rendered). Reasons: auth, guest-only, tokens, OAuth, payment.
    '/home/**': { ssr: false, prerender: false },
    '/checkout/pay/method': { ssr: false, prerender: false },
    '/checkout/pay/paypal': { ssr: false, prerender: false },
    '/checkout/pay/crypto': { ssr: false, prerender: false },
    '/checkout/pay/request-crypto': { ssr: false, prerender: false },
    '/checkout/pay/3d-secure': { ssr: false, prerender: false },
    // Payment confirmation — gated on a sessionStorage flag.
    '/checkout/success': { ssr: false, prerender: false },
    // Guest-only route (bakes in a redirect for authenticated users otherwise).
    '/login': { ssr: false, prerender: false },
    // OAuth callbacks — read window.location and sessionStorage (PKCE) at setup.
    '/oauth/**': { ssr: false, prerender: false },
    // Dynamic token routes + recover/send/changed forms (runtime backend state).
    '/activate/**': { ssr: false, prerender: false },
    '/password/**': { ssr: false, prerender: false },
    // Web3-wallet utility page, noindex — no SEO value, so keep it client-only.
    '/sponsor/submit-name': { ssr: false, prerender: false },
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
      sigilDebug: false,
      moneriumAuthBaseUrl: 'https://api.monerium.dev',
      moneriumAuthorizationCodeFlowClientId: '',
      recaptcha: {
        siteKey: '',
      },
      walletConnect: {
        projectId: '',
      },
    },
  },

  site: { url: 'https://rotki.com' },

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

  sitemap: { exclude: nonIndexed },
  // llms.txt / llms-full.txt / raw markdown endpoint for AI crawlers (see llms.config.ts).
  llms,
  // SSR bakes per-page <head> (title, meta, OG, JSON-LD) into the static HTML
  // for crawlers and JS-less social/LLM scrapers. No runtime server (static
  // preset). Client-only routes opt out via `routeRules` `ssr: false`.
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
        container: { center: true },
      },
    },
  },
});
