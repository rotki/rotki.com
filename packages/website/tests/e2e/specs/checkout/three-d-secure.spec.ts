import { Buffer } from 'node:buffer';
import { expect } from '@playwright/test';
import { test } from '../../support/fixtures';

/** Where Braintree's client reads its configuration; the fake token below points here. */
const CONFIG_URL = 'https://api.sandbox.braintreegateway.com/merchants/e2e/client_api/v1/configuration';

/** A client token in Braintree's format: base64 JSON with a fingerprint and the configuration URL. */
const CLIENT_TOKEN = Buffer.from(JSON.stringify({
  authorizationFingerprint: 'e2e-fingerprint',
  configUrl: CONFIG_URL,
  version: 2,
})).toString('base64');

const HANDOFF = {
  amount: '25.00',
  bin: '411111',
  discountCode: 'SUMMER',
  durationInMonths: 1,
  finalAmount: '22.50',
  nonce: 'e2e-nonce',
  planId: 3,
  planName: 'basic',
  renewingPrice: '25.00',
  token: CLIENT_TOKEN,
};

test.describe('3D Secure page', () => {
  test('explains a missing handoff and leads back to the plans', async ({ page }) => {
    await page.goto('/checkout/pay/3d-secure');

    const expired = page.getByTestId('three-d-secure-expired');
    await expect(expired.getByRole('heading', { level: 1, name: 'This bank confirmation has ended' })).toBeVisible();
    await expect(expired.getByRole('link', { name: 'Back to the plans' })).toHaveAttribute('href', '/checkout/pay');
  });

  test('shows what is being paid and a retry for the same plan when Braintree cannot start', async ({ page }) => {
    await page.route(`${CONFIG_URL}**`, async route => route.fulfill({ status: 500, body: '{}' }));
    await page.addInitScript((handoff) => {
      sessionStorage.setItem('threeDSecureData', JSON.stringify(handoff));
    }, HANDOFF);

    await page.goto('/checkout/pay/3d-secure');

    await expect(page.getByRole('heading', { level: 1, name: 'Your payment didn\'t go through' })).toBeVisible();
    const summary = page.getByTestId('three-d-secure-summary');
    await expect(summary.getByTestId('three-d-secure-amount')).toHaveText('22.50 €');
    await expect(summary.getByTestId('plan-name')).toHaveText('Basic, monthly');

    const failed = page.getByTestId('three-d-secure-failed');
    await expect(failed.getByRole('alert')).toBeVisible();
    await expect(failed.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', '/checkout/pay/card?planId=3&discountCode=SUMMER');
  });
});
