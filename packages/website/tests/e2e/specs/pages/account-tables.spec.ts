import { expect, type Locator, type Page } from '@playwright/test';
import { deviceFor, paymentFor } from '../../support/account-data';
import { subscriberAccount, subscriptionFor } from '../../support/backend-data';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForHydration(page);
}

/** The table under the section headed `title`. */
function tableIn(page: Page, title: string): Locator {
  return page.getByRole('main').locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).getByRole('table');
}

/** The text of one column, top to bottom, from the table's data rows. */
async function column(table: Locator, index: number): Promise<string[]> {
  return table.locator('tbody tr').locator(`td:nth-child(${index + 1})`).allInnerTexts();
}

test.describe('account tables', () => {
  test.describe('devices', () => {
    test.use({
      backendScenario: {
        devices: [deviceFor(1, 'Work laptop', 5), deviceFor(2, 'Home desktop', 3 * 24 * 60, 'darwin')],
      },
    });

    test('says how long ago each device was seen', async ({ page }) => {
      await open(page, '/home/devices');
      const devices = tableIn(page, 'Devices');

      await expect(devices.getByRole('row').filter({ hasText: 'Work laptop' })).toContainText('5 minutes ago');
      await expect(devices.getByRole('row').filter({ hasText: 'Home desktop' })).toContainText('3 days ago');
    });

    test('renames a device', async ({ backend, page }) => {
      await open(page, '/home/devices');
      await page.getByRole('button', { name: 'Rename Work laptop', exact: true }).click();

      const label = page.getByLabel('Device name');
      await expect(label).toHaveValue('Work laptop');
      await label.fill('Office laptop');
      await page.getByRole('button', { name: 'Save', exact: true }).click();

      await expect(tableIn(page, 'Devices')).toContainText('Office laptop');
      expect(backend.callsTo('PUT', '/webapi/2/devices/1/').map(call => call.body)).toEqual([{ label: 'Office laptop' }]);
    });

    test('deletes a device after asking', async ({ backend, page }) => {
      await open(page, '/home/devices');
      await page.getByRole('button', { name: 'Delete Home desktop', exact: true }).click();
      await expect(page.getByText('Are you sure you want to delete the device "Home desktop"?')).toBeVisible();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();

      await expect(tableIn(page, 'Devices')).not.toContainText('Home desktop');
      await expect(tableIn(page, 'Devices')).toContainText('Work laptop');
      expect(backend.callsTo('DELETE', '/webapi/2/devices/2/')).toHaveLength(1);
    });
  });

  test.describe('billing history', () => {
    test.use({
      backendScenario: {
        payments: [
          paymentFor({ eur_amount: 50, identifier: 'refund', is_refund: true, paid_at: '2026-10-01T10:00:00+00:00', paid_using: 'CRYPTO' }),
          paymentFor({ eur_amount: 25, identifier: 'card', paid_at: '2026-09-01T10:00:00+00:00' }),
          paymentFor({ eur_amount: 20, identifier: 'paypal', paid_at: '2026-08-01T10:00:00+00:00', paid_using: 'PAYPAL', referral_credit_applied_eur: 5 }),
        ],
      },
    });

    test('names each payment method, newest payment first', async ({ page }) => {
      await open(page, '/home/billing');
      const history = tableIn(page, 'Billing history');

      await expect(history.locator('tbody tr')).toHaveCount(3);
      expect(await column(history, 2)).toEqual(['Crypto', 'Card', 'PayPal + Credit']);
      expect(await column(history, 4)).toEqual(['Refunded', 'Paid', 'Paid']);
    });

    test('sorts by amount and by status', async ({ page }) => {
      await open(page, '/home/billing');
      const history = tableIn(page, 'Billing history');
      await expect(history.locator('tbody tr')).toHaveCount(3);

      await history.getByRole('button', { name: 'Amount', exact: true }).click();
      const amounts = (await column(history, 3)).map(amount => Number.parseFloat(amount));
      expect([[20, 25, 50], [50, 25, 20]]).toContainEqual(amounts);

      const statuses: string[][] = [];
      const status = history.getByRole('button', { name: 'Status', exact: true });
      await status.click();
      statuses.push(await column(history, 4));
      await status.click();
      statuses.push(await column(history, 4));
      expect(statuses).toContainEqual(['Paid', 'Paid', 'Refunded']);
      expect(statuses).toContainEqual(['Refunded', 'Paid', 'Paid']);
    });
  });

  test.describe('a cancelled card subscription', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptions: [subscriptionFor({
          actions: [],
          id: 'sub-card-1',
          is_soft_canceled: true,
          payment_method: 'card',
          payment_provider: 'braintree',
          status: 'Cancelled but still active',
        })],
      },
    });

    test('resumes, then cancels again with a reason', async ({ backend, page }) => {
      await open(page, '/home/subscription');
      const main = page.getByRole('main');

      await main.getByRole('button', { name: 'Resume subscription', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('you are charged again from February 01, 2026')).toBeVisible();
      await expect(dialog.getByTestId('resume-details')).toContainText('Basic');
      await expect(dialog.getByTestId('resume-details')).toContainText('Every month');
      await expect(dialog.getByTestId('resume-details')).toContainText('25.00 € on February 01, 2026');
      await dialog.getByRole('button', { name: 'Resume subscription', exact: true }).click();

      await expect(main.getByRole('button', { name: 'Cancel subscription', exact: true })).toBeVisible();
      expect(backend.callsTo('PATCH', '/webapi/2/subscriptions/sub-card-1/resume/')).toHaveLength(1);

      await main.getByRole('button', { name: 'Cancel subscription', exact: true }).click();
      await page.getByText('Too expensive', { exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel subscription', exact: true }).click();

      await expect(main.getByRole('button', { name: 'Resume subscription', exact: true })).toBeVisible();
      expect(backend.callsTo('DELETE', '/webapi/2/subscriptions/sub-card-1/')).toHaveLength(1);
      expect(backend.callsTo('POST', '/webapi/2/subscriptions/cancellation-feedback').map(call => call.body)).toEqual([
        expect.objectContaining({ reason: 1 }),
      ]);
    });
  });

  test.describe('API credentials', () => {
    test.describe('without credentials yet', () => {
      test.use({ backendScenario: { account: subscriberAccount() } });

      test('generates them on request', async ({ backend, page }) => {
        await open(page, '/home/devices');

        await page.getByRole('main').getByRole('button', { name: 'Generate', exact: true }).click();

        await expect(page.locator('input#api-key')).toHaveValue('new-api-key');
        await expect(page.locator('input#api-secret')).toHaveValue('new-api-secret');
        expect(backend.callsTo('PATCH', '/webapi/regenerate-keys/')).toHaveLength(1);
      });
    });

    test.describe('with credentials', () => {
      test.use({ backendScenario: { account: { ...subscriberAccount(), api_key: 'old-api-key', api_secret: 'old-api-secret' } } });

      test('shows them and replaces them with new ones', async ({ backend, page }) => {
        await open(page, '/home/devices');
        await expect(page.locator('input#api-key')).toHaveValue('old-api-key');
        await expect(page.locator('input#api-secret')).toHaveValue('old-api-secret');

        await page.getByRole('main').getByRole('button', { name: 'Create new credentials', exact: true }).click();

        await expect(page.locator('input#api-key')).toHaveValue('new-api-key');
        expect(backend.callsTo('PATCH', '/webapi/regenerate-keys/')).toHaveLength(1);
      });
    });
  });
});
