import process from 'node:process';
import { SIGIL_SCRIPT_URL, SIGIL_TRACKED_DOMAIN, SIGIL_WEBSITE_ID } from '@rotki/sigil';
import rotkiTheme from '@rotki/ui-library/theme';
import { comparisonPrerenderRoutes } from './app/utils/comparison-prerender';
import { featurePrerenderRoutes } from './app/utils/feature-prerender';
import { integrationPrerenderRoutes } from './app/utils/integration-prerender';
import { closedJobRoutes, jobsPrerenderRoutes } from './app/utils/jobs-prerender';
import { llms } from './app/utils/llms-config';
import { clientOnlyRouteRules, writeSpaManifest } from './app/utils/spa-routes';

// Build identifier for unique chunk names per deployment
const buildId = process.env.GIT_SHA?.slice(0, 8) || Date.now();

// Ordered manual-chunk rules — first matching predicate wins. Heavy libraries are
// listed before the core framework so Vue isn't pulled into the heavy chunks.
const manualChunkRules: [test: (id: string) => boolean, chunk: string][] = [
  // Vite preload helper - a separate small chunk that other chunks import, so the
  // heavy web3 stack isn't loaded just for the preload function.
  [id => id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill'), 'vite-helpers'],
  // Rollup commonjs interop helpers (virtual module \0commonjsHelpers.js), shared widely.
  [id => id.includes('\0commonjsHelpers'), 'commonjs-helpers'],
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
  // Common utilities - keep separate from heavy chunks.
  [id => id.includes('node_modules/destr'), 'utils'],
  [id => id.includes('node_modules/dayjs'), 'dayjs'],
  // Core framework - checked last so they don't end up in heavy chunks. Vue/VueUse/Pinia
  // are kept together to avoid circular deps.
  [id => id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia') || id.includes('node_modules/@vueuse'), 'vue-core'],
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
  ],
  // SSR bakes per-page <head> (title, meta, OG, JSON-LD) into the static HTML
  // for crawlers and JS-less social/LLM scrapers. No runtime server (static
  // preset). Client-only routes opt out via `routeRules` `ssr: false`.
  ssr: true,

  // Disable auto-import for application components - they should be imported explicitly
  // Nuxt's built-in components (NuxtLink, NuxtPage, etc.) remain available
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
    // The 404 body is served at whatever URL the visitor requested, so the Nuxt
    // runtime must not boot on it: it would hydrate against a payload for
    // /not-found, logging a mismatch and rewriting the address bar so the
    // visitor loses the URL they asked for. `noScripts` omits the runtime at
    // render time, which is why this page is prerendered but inert.
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
      // `/not-found` is the statically rendered 404 body the Go handler serves.
      // (`/200.html` and `/404.html` are added automatically by Nuxt's
      // nitro-server for static presets, and are un-hydrated SPA shells.)
      routes: ['/not-found', ...integrationPrerenderRoutes(), ...comparisonPrerenderRoutes(), ...featurePrerenderRoutes(), ...jobsPrerenderRoutes()],
    },
  },

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
        'viem',
        'viem/chains',
        '@wagmi/core',
        '@wagmi/connectors',
        '@walletconnect/universal-provider',
        '@coinbase/wallet-sdk',
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
            for (const [test, chunk] of manualChunkRules) {
              if (test(id))
                return chunk;
            }
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
        '../tests/**/*.ts',
        '../scripts/**/*.ts',
      ],
    },
  },
  hooks: {
    // Emit the SPA fallback manifest the Go static handler reads at startup.
    // Derived from `clientOnlyRoutes` so the backend can never drift from the
    // routes Nuxt actually leaves unrendered. Without this file the handler
    // refuses to start rather than silently serving 200 for every path.
    //
    // Hooked on `prerender:done` so the manifest is written against the
    // finished output rather than at `rollup:before`, when nothing exists yet.
    'nitro:init': (nitro) => {
      nitro.hooks.hook('prerender:done', () => {
        writeSpaManifest(nitro.options.output.publicDir);
      });
    },
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

  // Closed roles are prerendered so their URLs resolve, but must not be
  // advertised in the sitemap (they also carry noindex).
  sitemap: { exclude: [...nonIndexed, ...closedJobRoutes()] },

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
