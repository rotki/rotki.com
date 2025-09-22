/**
 * Content Security Policy Configuration
 * Organized by feature/service for better maintainability
 */

import type { ContentSecurityPolicyValue } from 'nuxt-security';

// Base CSP that applies to all pages
export const baseCSP: ContentSecurityPolicyValue = {
  'base-uri': ['\'self\''],
  'child-src': ['\'none\''],
  'connect-src': [
    '\'self\'',
    'api.github.com',
    'raw.githubusercontent.com/rotki/data/',
    'raw.githubusercontent.com/rotki/rotki.com/',
  ],
  'default-src': ['\'self\''],
  'font-src': ['\'self\'', 'data:', 'fonts.gstatic.com'],
  'form-action': ['\'self\''],
  'frame-ancestors': ['\'self\''],
  'frame-src': ['\'none\''],
  'img-src': [
    '\'self\'',
    'data:',
    'https://raw.githubusercontent.com/rotki/data/',
    'https://raw.githubusercontent.com/rotki/rotki/',
  ],
  'object-src': ['\'none\''],
  'report-uri': ['/api/csp/violation'],
  // Use nonce placeholders - nuxt-security will replace with actual nonces
  'script-src': ['\'self\'', '\'unsafe-eval\'', '\'nonce-{{nonce}}\''], // nonce for inline scripts
  'script-src-elem': ['\'self\'', '\'nonce-{{nonce}}\''], // nonce for script elements
  'style-src': ['\'self\'', '\'unsafe-inline\'', 'fonts.googleapis.com'], // Keep for styles
  'worker-src': ['\'self\''],
};

// Development-only additions - dynamic port configuration
export function createDevCSP(devPort = 3000, hmrPort = 4000): ContentSecurityPolicyValue {
  return {
    'connect-src': [
      `localhost:${hmrPort}`,
      `ws://localhost:${hmrPort}`,
      `wss://localhost:${hmrPort}`,
    ],
    'frame-src': [`localhost:${devPort}`],
    // Allow Vite dev client scripts with nonces
    'script-src': [`localhost:${devPort}`],
    'script-src-elem': [`localhost:${devPort}`],
  };
}

// reCAPTCHA requirements (for signup/password pages)
export const recaptchaCSP: ContentSecurityPolicyValue = {
  'connect-src': ['www.google.com/recaptcha/'],
  'frame-src': [
    '*.recaptcha.net',
    'recaptcha.net',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com',
  ],
  'img-src': ['www.gstatic.com/recaptcha'],
  'script-src': [
    'www.recaptcha.net',
    'recaptcha.net',
    'www.gstatic.com/recaptcha/',
    'www.gstatic.cn/recaptcha/',
    'www.google.com/recaptcha/',
  ],
  'script-src-elem': [
    'www.recaptcha.net',
    'recaptcha.net',
    'www.gstatic.com/recaptcha/',
    'www.gstatic.cn/recaptcha/',
    'www.google.com/recaptcha/',
  ],
  'worker-src': ['www.recaptcha.net'],
};

// WalletConnect/Web3 requirements (for sponsor and crypto payment pages)
export const walletConnectCSP: ContentSecurityPolicyValue = {
  'connect-src': [
    'https://rpc.walletconnect.com',
    'https://rpc.walletconnect.org',
    'https://relay.walletconnect.com',
    'https://relay.walletconnect.org',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'https://pulse.walletconnect.com',
    'https://pulse.walletconnect.org',
    'https://api.web3modal.com',
    'https://api.web3modal.org',
    'https://keys.walletconnect.com',
    'https://keys.walletconnect.org',
    'https://notify.walletconnect.com',
    'https://notify.walletconnect.org',
    'https://echo.walletconnect.com',
    'https://echo.walletconnect.org',
    'https://push.walletconnect.com',
    'https://push.walletconnect.org',
    'wss://www.walletlink.org',
    'https://chain-proxy.wallet.coinbase.com',
  ],
  'frame-src': [
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://secure.walletconnect.com',
    'https://secure.walletconnect.org',
  ],
  'img-src': [
    '\'unsafe-inline\'', // Required for blob: URLs
    'blob:',
    'https://walletconnect.org',
    'https://walletconnect.com',
    'https://secure.walletconnect.com',
    'https://secure.walletconnect.org',
    'https://tokens-data.1inch.io',
    'https://tokens.1inch.io',
    'https://ipfs.io',
  ],
  // Allow extension scripts to run
  'script-src': [
    // Browser extension protocols
    'chrome-extension:',
    'moz-extension:',
    'safari-web-extension:',
    'edge-extension:',
    // Allow inline scripts for wallet injections
    '\'unsafe-inline\'',
  ],
  'script-src-elem': [
    // Browser extension protocols
    'chrome-extension:',
    'moz-extension:',
    'safari-web-extension:',
    'edge-extension:',
    // Allow inline scripts for wallet injections
    '\'unsafe-inline\'',
  ],
};

// Braintree base requirements (for all payment pages)
export const braintreeBaseCSP: ContentSecurityPolicyValue = {
  'child-src': ['assets.braintreegateway.com'],
  'connect-src': [
    'api.sandbox.braintreegateway.com',
    'api.braintreegateway.com',
    'client-analytics.sandbox.braintreegateway.com',
    'client-analytics.braintreegateway.com',
    '*.braintree-api.com',
    'www.paypal.com/xoplatform/logger/api/logger',
  ],
  'frame-src': ['assets.braintreegateway.com'],
  'img-src': ['assets.braintreegateway.com'],
  'script-src': [
    'js.braintreegateway.com',
    'assets.braintreegateway.com',
  ],
  'script-src-elem': [
    'js.braintreegateway.com',
    'assets.braintreegateway.com',
  ],
};

// PayPal specific additions
export const paypalCSP: ContentSecurityPolicyValue = {
  'child-src': ['*.paypal.com'],
  'connect-src': ['*.paypal.com'],
  'frame-src': ['*.paypal.com'],
  'img-src': [
    'checkout.paypal.com',
    'www.paypalobjects.com',
  ],
  'script-src': [
    '*.paypal.com',
    'www.paypalobjects.com',
    '\'unsafe-inline\'',
  ],
  'script-src-elem': [
    '*.paypal.com',
    'www.paypalobjects.com',
    '\'unsafe-inline\'',
  ],
};

// 3D Secure (for card payments)
export const threeDSecureCSP: ContentSecurityPolicyValue = {
  'connect-src': ['*.cardinalcommerce.com'],
  'form-action': ['\'self\'', '*'],
  'frame-src': ['*'], // Required for 3D Secure iframes
  'script-src': [
    '*', // Required for dynamic 3D Secure scripts
    'songbird.cardinalcommerce.com',
    'songbirdstag.cardinalcommerce.com',
  ],
  'script-src-elem': [
    'songbird.cardinalcommerce.com',
    'songbirdstag.cardinalcommerce.com',
  ],
};

/**
 * Helper function to merge CSP configurations
 */
export function mergeCSP(...configs: Array<ContentSecurityPolicyValue>): ContentSecurityPolicyValue {
  const merged: ContentSecurityPolicyValue = {};

  for (const config of configs) {
    for (const [directive, values] of Object.entries(config)) {
      if (!merged[directive]) {
        merged[directive] = [];
      }
      // Add unique values only
      if (Array.isArray(values)) {
        for (const value of values) {
          if (!merged[directive]!.includes(value)) {
            merged[directive]!.push(value);
          }
        }
      }
    }
  }

  // Post-process to handle 'none' keyword
  for (const [directive, values] of Object.entries(merged)) {
    if (Array.isArray(values) && values.length > 1 && values.includes('\'none\'')) {
      // Remove 'none' if there are other values (since 'none' is ignored in that case)
      merged[directive] = values.filter(v => v !== '\'none\'');
    }
  }

  return merged;
}
