/* eslint-disable max-lines */
import process from 'node:process';
import rotkiTheme from '@rotki/ui-library/theme';
import { removeNoncePlaceholders } from './app/utils/csp-utils';
import {
  baseCSP,
  braintreeBaseCSP,
  createDevCSP,
  mergeCSP,
  paypalCSP,
  recaptchaCSP,
  threeDSecureCSP,
  walletConnectCSP,
} from './csp-config';

const sponsorshipEnabled = process.env.NUXT_PUBLIC_SPONSORSHIP_ENABLED === 'true';

// Build identifier for unique chunk names per deployment
const buildId = process.env.GIT_SHA?.slice(0, 8) || Date.now();

const sponsorRoutes = [
  '/sponsor',
  '/sponsor/**',
];

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
  ...(!sponsorshipEnabled ? sponsorRoutes : []),
];

const domain = process.env.PROXY_DOMAIN ?? 'localhost';
const insecureProxy = process.env.PROXY_INSECURE;
const proxyProtocol = insecureProxy === 'true' ? 'http' : 'https';
const baseUrl = `${proxyProtocol}://${domain}`;
const referrer = insecureProxy ? baseUrl : `${baseUrl}`; // change to ${baseUrl}:443 if you get 403

const proxy = {
  host: domain,
  mediaTarget: `${baseUrl}/media`,
  referrer,
  target: `${baseUrl}/webapi`,
};

// Dynamic port configuration for development CSP
const devPort = Number(process.env.NUXT_DEV_PORT) || 3000;
const hmrPort = Number(process.env.NUXT_HMR_PORT) || 4000;
const devCSP = createDevCSP(devPort, hmrPort);

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

  compatibilityDate: '2025-03-01',

  future: {
    compatibilityVersion: 4,
  },

  // Disable auto-import for application components - they should be imported explicitly
  // Nuxt's built-in components (NuxtLink, NuxtPage, etc.) remain available
  components: false,

  css: [
    '@fontsource/roboto/latin-400.css',
    '@fontsource/roboto/latin-500.css',
    '@fontsource/roboto/latin-600.css',
    '@fontsource/roboto/latin-700.css',
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
    '@nuxtjs/sitemap',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    ['@pinia/nuxt', { disableVuex: true }],
    '@nuxt/test-utils/module',
    './modules/ui-library/module.ts',
    '@nuxt/image',
    'nuxt-security',
  ],

  image: {
    domains: ['raw.githubusercontent.com'],
    alias: {
      // Abstract the GitHub URL - can change source without updating data
      integrations: 'https://raw.githubusercontent.com/rotki/rotki/develop/frontend/app/public/assets/images/protocols',
    },
  },

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
        target: 'http://localhost:3001/checkout/pay/card',
        ws: true,
      },
      '/media': {
        changeOrigin: true,
        headers: {
          host: proxy.host,
          origin: proxy.referrer,
          referer: proxy.referrer,
        },
        target: proxy.mediaTarget,
      },
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
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Run `ntf:cache` task every 5 minutes
      '*/5 * * * *': ['nft:cache'],
    },
    storage: {
      // Filesystem cache for Nuxt Image ipx (Docker volume: /app/cache/ipx)
      'cache:ipx': {
        base: '/app/cache/ipx',
        driver: 'fs',
      },
    },
  },

  routeRules: {
    '/': {
      prerender: true,
    },
    // Redirect /pricing to /checkout/pay
    '/pricing': { redirect: { to: '/checkout/pay', statusCode: 301 } },
    // Global no-cache rule for HTML to prevent CSP nonce mismatches
    ...(process.env.NODE_ENV !== 'development'
      ? {
          '/**': {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          },
        }
      : {}),
    '/home/payment-methods': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            braintreeBaseCSP,
            threeDSecureCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginEmbedderPolicy: 'unsafe-none', // Match card payment page
          crossOriginResourcePolicy: 'cross-origin', // Allow Braintree and 3DS resources
        },
      },
    },
    '/checkout/pay': {
      prerender: true,
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            recaptchaCSP,
            braintreeBaseCSP,
            threeDSecureCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
        },
      },
    },
    // Dedicated 3D Secure verification page
    '/checkout/pay/3d-secure': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            braintreeBaseCSP,
            threeDSecureCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginEmbedderPolicy: 'unsafe-none', // Match card payment page
          crossOriginResourcePolicy: 'cross-origin', // Allow Braintree resources
        },
      },
    },
    // Crypto payment pages with WalletConnect
    '/checkout/pay/crypto': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            removeNoncePlaceholders(baseCSP),
            walletConnectCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginOpenerPolicy: 'unsafe-none', // Required for Coinbase Wallet SDK
        },
      },
    },
    // Payment method selection page (base Braintree)
    '/checkout/pay/method': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            recaptchaCSP,
            braintreeBaseCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
        },
      },
    },
    // PayPal payment page
    '/checkout/pay/paypal': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            removeNoncePlaceholders(baseCSP),
            recaptchaCSP,
            braintreeBaseCSP,
            paypalCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginOpenerPolicy: 'same-origin-allow-popups',
          crossOriginEmbedderPolicy: 'unsafe-none', // Required for PayPal SDK
          crossOriginResourcePolicy: 'cross-origin', // Allow PayPal resources
        },
      },
    },
    '/checkout/pay/request-crypto': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            walletConnectCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginOpenerPolicy: 'unsafe-none', // Required for Coinbase Wallet SDK
        },
      },
    },
    '/password/recover': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            recaptchaCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
        },
      },
    },
    // Account pages with reCAPTCHA
    '/signup': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            baseCSP,
            recaptchaCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
        },
      },
    },
    // Sponsor pages with WalletConnect
    '/sponsor/**': {
      security: {
        headers: {
          contentSecurityPolicy: mergeCSP(
            removeNoncePlaceholders(baseCSP),
            walletConnectCSP,
            ...(process.env.NODE_ENV === 'development' ? [devCSP] : []),
          ),
          crossOriginOpenerPolicy: 'unsafe-none', // Required for Coinbase Wallet SDK
        },
      },
    },
  },

  runtimeConfig: {
    googleClientSecret: '',
    moneriumClientSecret: '',
    public: {
      baseUrl: '',
      contact: {
        bespokeEmail: 'bespoke-accounting@rotki.com',
        bespokeEmailMailTo: 'mailto:bespoke-accounting@rotki.com',
        discord: 'https://discord.rotki.com',
        email: 'info@rotki.com',
        emailMailto: 'mailto:info@rotki.com',
        github: 'https://github.com/rotki',
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
      sponsorshipEnabled: false,
      testing: false,
      walletConnect: {
        projectId: '',
      },
    },
    redis: {
      host: '',
      password: '',
    },
  },

  security: {
    enabled: process.env.SKIP_CSP !== 'true',
    headers: {
      // Base CSP for all pages (minimal, most restrictive)
      contentSecurityPolicy: process.env.NODE_ENV === 'development'
        ? mergeCSP(baseCSP, devCSP)
        : baseCSP,
    },
    hidePoweredBy: true,
    nonce: true,
    sri: true,
  },

  site: {
    url: 'https://rotki.com',
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
        '../csp-config.ts',
        '../tests/**/*.ts',
      ],
    },
  },

  tailwindcss: {
    config: {
      content: [
        './app/components/**/*.{vue,js,ts}',
        './app/layouts/**/*.vue',
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
