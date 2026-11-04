import { expect } from '@playwright/test';
import { test } from '../../support/fixtures';

const RECEIPT = {
  durationInMonths: 1,
  method: 'card',
  paid: '22.50',
  planName: 'basic',
  renewingPrice: '25.00',
  upgrade: false,
};

test.describe('checkout success page', () => {
  test('sends a visit without a payment to the subscription page', async ({ page }) => {
    await page.goto('/checkout/success');

    await expect(page).toHaveURL(/\/home\/subscription/);
  });

  test('confirms the plan and leads on to the API credentials', async ({ page }) => {
    await page.addInitScript((receipt) => {
      sessionStorage.setItem('payment-completed', JSON.stringify(receipt));
    }, RECEIPT);

    await page.goto('/checkout/success');

    await expect(page.getByRole('heading', { level: 1, name: 'You\'re on Basic' })).toBeVisible();
    await expect(page.getByText('Your payment of 22.50 € went through.')).toBeVisible();
    const receipt = page.locator('[data-cy="subscription-receipt"]');
    await expect(receipt.locator('[data-cy="receipt-plan"]')).toHaveText('Basic, monthly');
    await expect(receipt.locator('[data-cy="receipt-method"]')).toHaveText('Card');
    await expect(page.getByRole('link', { name: 'Create API credentials' })).toHaveAttribute('href', '/home/devices');
    await expect(page.getByRole('list', { name: 'Checkout steps' }).locator('[aria-current="step"]')).toContainText('Confirmation');
  });
});
