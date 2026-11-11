import type { Page } from '@playwright/test';
import { Buffer } from 'node:buffer';

const MERCHANT_URL = 'https://api.sandbox.braintreegateway.com/merchants/e2e';
const CLIENT_API_URL = `${MERCHANT_URL}/client_api`;

/** The nonce Braintree hands back for the approved PayPal account. */
export const PAYPAL_NONCE = 'e2e-paypal-nonce';

/** A sandbox client token in Braintree's format, pointing the client at the fake configuration. */
export const BRAINTREE_CLIENT_TOKEN = Buffer.from(JSON.stringify({
  authorizationFingerprint: 'e2e-fingerprint',
  configUrl: `${CLIENT_API_URL}/v1/configuration`,
  version: 2,
})).toString('base64');

/** The gateway configuration of a sandbox merchant with PayPal enabled, as `client.create` reads it. */
function clientConfiguration(): Record<string, unknown> {
  return {
    analytics: { url: 'https://origin-analytics-sand.sandbox.braintree-api.com/e2e' },
    assetsUrl: 'https://assets.braintreegateway.com',
    challenges: [],
    clientApiUrl: CLIENT_API_URL,
    creditCards: { supportedCardTypes: [] },
    environment: 'sandbox',
    graphQL: { features: [], url: 'https://payments.sandbox.braintree-api.com/graphql' },
    merchantId: 'e2e',
    paypal: {
      assetsUrl: 'https://checkout.paypal.com',
      clientId: 'e2e-paypal-client',
      currencyIsoCode: 'EUR',
      displayName: 'rotki',
      environment: 'offline',
      environmentNoNetwork: false,
      unvettedMerchant: false,
    },
    paypalEnabled: true,
    threeDSecureEnabled: false,
  };
}

/**
 * Stands in for the PayPal SDK. Its button runs the page's own callbacks the way PayPal does
 * once the buyer approves in the popup: create the billing agreement, then approve it.
 */
const PAYPAL_SDK_STUB = `
window.paypal = {
  FUNDING: { PAYPAL: 'paypal', CARD: 'card' },
  Buttons(options) {
    return {
      isEligible() { return true; },
      async render(selector) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'PayPal';
        button.dataset.testid = 'paypal-stub-button';
        button.style.height = '48px';
        button.addEventListener('click', async () => {
          const billingToken = await options.createBillingAgreement();
          await options.onApprove({ billingToken, payerID: 'E2E-PAYER' });
        });
        document.querySelector(selector).append(button);
      },
    };
  },
};
`;

/**
 * Answers Braintree's sandbox API and the PayPal SDK script, so the PayPal page runs end to end.
 * Any other request to PayPal or Braintree is aborted, so nothing leaves the test; that route is
 * registered first, which lets the specific answers after it win.
 */
export async function installFakeBraintree(page: Page): Promise<void> {
  await page.route(/^https:\/\/([\w-]+\.)*(paypal|braintreegateway|braintree-api)\.com\//, async route => route.abort());
  await page.route(`${CLIENT_API_URL}/v1/configuration**`, async route => route.fulfill({ json: clientConfiguration() }));
  await page.route(`${CLIENT_API_URL}/v1/paypal_hermes/setup_billing_agreement**`, async route => route.fulfill({
    json: { agreementSetup: { approvalUrl: 'https://www.sandbox.paypal.com/agreements/approve?ba_token=BA-E2E', tokenId: 'BA-E2E' } },
  }));
  await page.route(`${CLIENT_API_URL}/v1/payment_methods/paypal_accounts**`, async route => route.fulfill({
    json: { paypalAccounts: [{ details: { email: 'buyer@example.com', payerInfo: {} }, nonce: PAYPAL_NONCE, type: 'PayPalAccount' }] },
  }));
  await page.route('https://origin-analytics-sand.sandbox.braintree-api.com/**', async route => route.fulfill({ json: {} }));
  await page.route('https://www.paypal.com/sdk/js**', async route => route.fulfill({ body: PAYPAL_SDK_STUB, contentType: 'application/javascript' }));
  // PayPal's logger and Braintree's frame answer empty, so the SDK carries on as if they were there.
  await page.route('https://www.paypal.com/xoplatform/**', async route => route.fulfill({ json: {} }));
  await page.route('https://checkout.paypal.com/**', async route => route.fulfill({ body: '<!doctype html><title>e2e</title>', contentType: 'text/html' }));
}
