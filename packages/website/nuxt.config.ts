import process from 'node:process';
import rotkiTheme from '@rotki/ui-library/theme';
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
import { removeNoncePlaceholders } from './utils/csp-utils';

const sponsorshipEnabled = process.env.NUXT_PUBLIC_SPONSORSHIP_ENABLED === 'true';

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
    'nuxt-security',
  ],

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
  },

  robots: {
    groups: [{
      disallow: nonIndexed,
      userAgent: '*',
    }],
  },

  routeRules: {
    '/home/**': { robots: false },
    ...(!sponsorshipEnabled ? { '/sponsor/**': { robots: false } } : {}),

    // Legacy checkout/pay route (can be removed once unused)
    '/checkout/pay': {
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
    hidePoweredBy: false,
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
  tailwindcss: {
    config: {
      content: [
        './components/**/*.{vue,js,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
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
