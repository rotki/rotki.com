import process from 'node:process';
import { SIGIL_SCRIPT_URL, SIGIL_TRACKED_DOMAIN, SIGIL_WEBSITE_ID } from '@rotki/sigil';
import { comparisonPrerenderRoutes } from './app/utils/comparison-prerender';
import { featurePrerenderRoutes } from './app/utils/feature-prerender';
import { integrationPrerenderRoutes } from './app/utils/integration-prerender';
import { closedJobRoutes, jobsPrerenderRoutes } from './app/utils/jobs-prerender';
import { llms } from './app/utils/llms-config';
import { devOptimizeDeps } from './app/utils/optimize-deps';
import { clientOnlyRouteRules, writeSpaManifest } from './app/utils/spa-routes';

// Build identifier for unique chunk names per deployment
const gitSha = process.env.GIT_SHA;
const buildId = gitSha ? gitSha.slice(0, 8) : Date.now();

/**
 * Named chunk groups, in precedence order: when two groups want the same module,
 * the earlier one gets it.
 *
 * Rolldown also pulls every dependency of a captured module into its group. So the
 * groups for code every page needs must come before the heavy optional ones:
 * otherwise `swiper/vue` drags Vue into the swiper chunk, the Coinbase SDK drags
 * the preload helper into its chunk, walletconnect drags in `destr`, and every
 * page downloads those heavy chunks.
 */
const chunkGroups: [test: (id: string) => boolean, chunk: string][] = [
  // Vite preload helper: its own small chunk, so the web3 stack isn't loaded just for preloading.
  [id => id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill'), 'vite-helpers'],
  // Commonjs interop helpers, shared widely.
  [id => id.includes('\0commonjsHelpers'), 'commonjs-helpers'],
  // Vue/VueUse/Pinia share one chunk to avoid circular deps.
  [id => id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia') || id.includes('node_modules/@vueuse'), 'vue-core'],
  // Common utilities, also dependencies of the web3 stack.
  [id => id.includes('node_modules/destr'), 'utils'],
  [id => id.includes('node_modules/dayjs'), 'dayjs'],
  // Web3/Wallet stack - split so it only loads when a crypto/sponsor flow needs it.
  [id => id.includes('node_modules/viem'), 'viem'],
  [id => id.includes('@wagmi/'), 'wagmi'],
  [id => id.includes('@walletconnect/'), 'walletconnect'],
  [id => id.includes('@coinbase/wallet-sdk'), 'coinbase-wallet'],
  // Braintree payment SDK - split by submodule.
  [id => id.includes('braintree-web') && id.includes('/client'), 'braintree-client'],
  [id => id.includes('braintree-web') && id.includes('/three-d-secure'), 'braintree-3ds'],
  [id => id.includes('braintree-web') && id.includes('/paypal-checkout'), 'braintree-paypal'],
  [id => id.includes('braintree-web') && id.includes('/hosted-fields'), 'braintree-hosted-fields'],
  [id => id.includes('braintree-web') && id.includes('/vault-manager'), 'braintree-vault'],
  [id => id.includes('braintree-web'), 'braintree-core'],
  // Swiper carousel - only needed on pages with carousels.
  [id => id.includes('swiper'), 'swiper'],
  // QR code generation - only needed for crypto payments.
  [id => id.includes('qrcode'), 'qrcode'],
];

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
  '/not-found',
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
    './modules/app-screenshots/module.ts',
    './modules/integration-images/module.ts',
    './modules/integration-seo/module.ts',
    './modules/comparison-seo/module.ts',
    './modules/feature-seo/module.ts',
    './modules/ui-library/module.ts',
    './modules/card-payment-dev-proxy/module.ts',
  ],
  /*
   * SSR bakes per-page <head> (title, meta, OG, JSON-LD) into the static HTML
   * for crawlers and JS-less social/LLM scrapers. No runtime server (static
   * preset). Client-only routes opt out via `routeRules` `ssr: false`.
   */
  ssr: true,

  // Application components are imported explicitly; Nuxt built-ins (NuxtLink, NuxtPage) stay available.
  components: false,

  imports: {
    scan: false,
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development' && !(!!process.env.CI || !!process.env.TEST),
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

  css: [
    '~/assets/css/tailwind.css',
  ],

  site: { url: 'https://rotki.com' },
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
  routeRules: {
    // Redirect /pricing to /checkout/pay
    '/pricing': { redirect: { to: '/checkout/pay', statusCode: 301 } },
    /*
     * The 404 body is served at whatever URL the visitor requested, so the Nuxt
     * runtime must not boot on it: it would hydrate against a payload for
     * /not-found, logging a mismatch and rewriting the address bar so the
     * visitor loses the URL they asked for. `noScripts` omits the runtime at
     * render time, which is why this page is prerendered but inert.
     */
    '/not-found': { noScripts: true },
    ...clientOnlyRouteRules(),
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  compatibilityDate: '2025-03-01',

  nitro: {
    // SSG: pre-render all discoverable routes
    preset: 'static',
    prerender: {
      crawlLinks: true,
      // Guardrail: fail the build if an indexable route errors while rendering — make it ssr:false instead.
      failOnError: true,
      /*
       * `/not-found` is the statically rendered 404 body the Go handler serves.
       * (`/200.html` and `/404.html` are added automatically by Nuxt's
       * nitro-server for static presets, and are un-hydrated SPA shells.)
       */
      routes: ['/not-found', ...integrationPrerenderRoutes(), ...comparisonPrerenderRoutes(), ...featurePrerenderRoutes(), ...jobsPrerenderRoutes()],
    },
  },

  vite: {
    optimizeDeps: {
      include: devOptimizeDeps,
    },
    build: {
      // No automatic modulepreload links; dynamic imports still work but don't preload their dependencies.
      modulePreload: { polyfill: true, resolveDependencies: () => [] },
      rolldownOptions: {
        output: {
          // The build id keeps filenames unique per deployment: _nuxt/<name>-<buildId>.<hash>.js
          chunkFileNames: `_nuxt/[name]-${buildId}.[hash].js`,
          entryFileNames: `_nuxt/[name]-${buildId}.[hash].js`,
          codeSplitting: {
            groups: chunkGroups.map(([test, name]) => ({ name, test })),
          },
        },
      },
    },
  },

  typescript: {
    tsConfig: {
      include: [
        '../vitest.config.ts',
        '../playwright.config.ts',
        '../content.config.ts',
        '../tailwind.config.ts',
        '../tests/**/*.ts',
        '../scripts/**/*.ts',
      ],
    },
  },
  hooks: {
    /**
     * Emits the SPA fallback manifest the Go static handler reads at startup.
     * Derived from `clientOnlyRoutes` so the backend can never drift from the
     * routes Nuxt actually leaves unrendered. Without this file the handler
     * refuses to start rather than silently serving 200 for every path.
     *
     * Hooked on `prerender:done` so the manifest is written against the
     * finished output rather than at `rollup:before`, when nothing exists yet.
     */
    'nitro:init': (nitro) => {
      nitro.hooks.hook('prerender:done', () => {
        writeSpaManifest(nitro.options.output.publicDir);
      });
    },
    /**
     * Disables prefetch of lazily imported chunks, so a page never downloads code
     * for flows it may not reach (wallets, payments).
     *
     * Static imports keep their modulepreload links. The page needs them before it
     * can hydrate, and without the links the browser only finds each chunk after
     * parsing the one that imports it, one round trip per level.
     */
    'build:manifest': (manifest) => {
      for (const [key, item] of Object.entries(manifest)) {
        const isFont = key.endsWith('.woff2') || key.endsWith('.woff') || key.endsWith('.ttf');
        if (!isFont) {
          item.prefetch = false;
          item.dynamicImports = [];
        }
      }
    },
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

  i18n: {
    defaultLocale: 'en-US',
    locales: [{ code: 'en-US', file: 'en.json', language: 'en-US' }],
    strategy: 'no_prefix',
  },
  // llms.txt / llms-full.txt / raw markdown endpoint for AI crawlers (see llms.config.ts).
  llms,

  // Closed roles are prerendered so their URLs resolve, but stay out of the sitemap (they carry noindex).
  sitemap: { exclude: [...nonIndexed, ...closedJobRoutes()] },
});
