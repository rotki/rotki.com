import { expect } from '@playwright/test';
import { defaultBreakdown } from '../../support/backend-data';
import { BRAINTREE_CLIENT_TOKEN, installFakeBraintree, PAYPAL_NONCE } from '../../support/braintree';
import { test } from '../../support/fixtures';

test.describe('PayPal payment', () => {
  test.use({ backendScenario: { breakdown: { ...defaultBreakdown(), braintree_client_token: BRAINTREE_CLIENT_TOKEN } } });

  test.beforeEach(async ({ page }) => {
    await installFakeBraintree(page);
  });

  test('pays with PayPal once the policy is accepted and lands on the success page', async ({ backend, page }) => {
    await page.goto('/checkout/pay/paypal?planId=3');

    const button = page.locator('[data-cy="paypal-stub-button"]');
    await expect(button).toBeVisible();
    await expect(page.locator('[data-cy="paypal-unavailable"]')).toHaveCount(0);
    await expect(page.locator('#paypal-button')).toHaveClass(/pointer-events-none/);

    await page.getByRole('checkbox', { name: /refund and cancellation policy/ }).check();
    await expect(page.locator('#paypal-button')).not.toHaveClass(/pointer-events-none/);
    await button.click();

    await expect(page).toHaveURL(/\/checkout\/success$/);
    await expect(page.getByRole('heading', { level: 1, name: 'You\'re on Basic' })).toBeVisible();
    await expect(page.locator('[data-cy="receipt-method"]')).toHaveText('PayPal');

    expect(backend.callsTo('POST', '/webapi/payment/btr/paypal/')[0]?.body).toMatchObject({ payment_method_nonce: PAYPAL_NONCE });
    expect(backend.callsTo('POST', '/webapi/payment/btr/paypal/nonce/')[0]?.body).toMatchObject({ payment_token: 'paypal-vault-token' });
    expect(backend.callsTo('POST', '/webapi/2/braintree/payments')[0]?.body).toMatchObject({ payment_method_nonce: 'paypal-vault-nonce', plan_id: 3 });
  });

  test.describe('when the charge is declined', () => {
    test.use({
      backendScenario: {
        braintreePayment: { message: 'Your PayPal account could not be charged.', status: 400 },
        breakdown: { ...defaultBreakdown(), braintree_client_token: BRAINTREE_CLIENT_TOKEN },
      },
    });

    test('shows the decline under the heading and stays on the page', async ({ page }) => {
      await page.goto('/checkout/pay/paypal?planId=3');
      await page.getByRole('checkbox', { name: /refund and cancellation policy/ }).check();
      await page.locator('[data-cy="paypal-stub-button"]').click();

      await expect(page.locator('[data-cy="checkout-alert"]')).toContainText('Your PayPal account could not be charged.');
      await expect(page).toHaveURL(/\/checkout\/pay\/paypal\?/);
    });
  });
});
