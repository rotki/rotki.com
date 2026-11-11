import { expect, type Page } from '@playwright/test';
import { acceptPolicyAndContinue, selectAsset } from '../../support/checkout';
import { test } from '../../support/fixtures';

const PHONE = { height: 844, width: 390 };

async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
}

test.describe('payment page layout', () => {
  test.describe('PayPal', () => {
    test('asks how to pay, marks PayPal and keeps consent and the PayPal buttons under the summary', async ({ page }) => {
      await page.goto('/checkout/pay/paypal?planId=3');

      await expect(page.getByRole('heading', { level: 1, name: 'How would you like to pay?' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Payment method' }).getByRole('link', { name: /PayPal/ })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('heading', { level: 2, name: 'Pay with PayPal' })).toBeVisible();

      const summary = page.getByTestId('order-summary');
      await expect(summary.getByRole('heading', { name: 'Order summary' })).toBeVisible();
      await expect(summary.getByTestId('grand-total')).toHaveText('25.00 €');

      const pay = page.getByTestId('payment-page-pay');
      await expect(pay.getByRole('checkbox', { name: 'I agree to the refund and cancellation policy' })).toBeVisible();
      await expect(pay.locator('#paypal-button')).toBeAttached();
      // The e2e backend gives PayPal no client token, so the slot explains it and offers a reload.
      await expect(pay.getByTestId('paypal-unavailable')).toContainText('PayPal didn\'t load.');
      await expect(page.getByTestId('checkout-error')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);

      // The summary column sits to the right of the PayPal panel on a desktop.
      const panel = await page.getByTestId('paypal-panel').boundingBox();
      const summaryBox = await summary.boundingBox();
      expect(summaryBox?.x).toBeGreaterThan((panel?.x ?? 0) + (panel?.width ?? 0));
      await expectNoSidewaysScroll(page);
    });

    test.describe('on a phone', () => {
      test.use({ viewport: PHONE });

      test('folds the summary into a bar with the total and keeps consent at the bottom of the screen', async ({ page }) => {
        await page.goto('/checkout/pay/paypal?planId=3');

        const toggle = page.getByTestId('summary-toggle');
        await expect(toggle).toContainText('Order summary');
        await expect(toggle).toContainText('then 25.00 €/month');
        await expect(toggle).toContainText('25.00 €');
        await expect(page.getByTestId('order-summary')).toBeHidden();

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByTestId('order-summary')).toBeVisible();

        const pay = await page.getByTestId('payment-page-pay').boundingBox();
        expect(Math.round((pay?.y ?? 0) + (pay?.height ?? 0))).toBe(PHONE.height);
        await expectNoSidewaysScroll(page);
      });
    });
  });

  test.describe('crypto', () => {
    test('asks for the network and token and only shows the payment details once both and the policy are set', async ({ page }) => {
      await page.goto('/checkout/pay/request-crypto?planId=3');

      await expect(page.getByRole('heading', { level: 1, name: 'How would you like to pay?' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Payment method' }).getByRole('link', { name: /Crypto/ })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('heading', { level: 2, name: '1. Choose network and token' })).toBeVisible();
      await expect(page.getByTestId('crypto-send-placeholder')).toContainText('2. Send the payment');
      await expect(page.getByTestId('order-summary').getByTestId('next-payment')).toContainText('Crypto payments do not renew');

      const show = page.getByRole('button', { name: 'Show payment details' });
      await expect(show).toBeDisabled();
      await selectAsset(page, 'Ethereum', 'ETH (Ether)');
      await expect(show).toBeDisabled();

      await acceptPolicyAndContinue(page);

      await expect(page.getByRole('heading', { level: 1, name: 'Send the payment' })).toBeVisible();
      await expect(page.getByTestId('crypto-asset-panel')).toContainText('ETH on Ethereum');
      const panel = page.getByTestId('crypto-payment-panel');
      await expect(panel.getByRole('heading', { level: 2, name: '2. Send the payment' })).toBeVisible();
      await expect(panel.getByTestId('crypto-exact-amount')).toContainText('Send exactly 0.01 ETH, on Ethereum only.');
      await expect(panel.getByRole('button', { name: 'Connect wallet' })).toBeVisible();
      await expect(panel.getByTestId('crypto-payment-qr')).toBeVisible();
      await expect(page.getByTestId('order-summary')).toBeAttached();
      await expectNoSidewaysScroll(page);
    });

    test.describe('on a phone', () => {
      test.use({ viewport: PHONE });

      test('keeps the summary folded, the tiles on one row and the consent inside the crypto panel', async ({ page }) => {
        await page.goto('/checkout/pay/request-crypto?planId=3');

        const toggle = page.getByTestId('summary-toggle');
        await expect(toggle).toContainText('25.00 €');
        await expect(toggle).toContainText('paid in crypto');
        const tiles = page.getByRole('navigation', { name: 'Payment method' }).getByRole('link');
        const tops = await tiles.evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().top)));
        expect(new Set(tops).size).toBe(1);
        await expect(page.getByTestId('crypto-panel').getByRole('button', { name: 'Show payment details' })).toBeVisible();
        await expect(page.getByTestId('payment-page-pay')).toHaveCount(0);
        await expectNoSidewaysScroll(page);
      });

      test('folds the QR code away on the send page', async ({ page }) => {
        await page.goto('/checkout/pay/request-crypto?planId=3');
        await selectAsset(page, 'Ethereum', 'ETH (Ether)');
        await acceptPolicyAndContinue(page);

        const qr = page.getByTestId('crypto-payment-qr');
        await expect(qr).toBeHidden();
        await page.getByTestId('crypto-qr-toggle').click();
        await expect(qr).toBeVisible();
        await expectNoSidewaysScroll(page);
      });
    });
  });
});
