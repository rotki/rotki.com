import { expect, type Locator, type Page } from '@playwright/test';
import { cardFor, creditWithHistory, paymentFor } from '../../support/account-data';
import { subscriberAccount, subscriptionFor } from '../../support/backend-data';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForHydration(page);
}

/** The section headed `title`. */
function section(page: Page, title: string): Locator {
  return page.getByRole('main').locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

/** The saved card row that names the card ending in `last4`. */
function cardRow(page: Page, last4: string): Locator {
  return section(page, 'Payment method').locator('.rounded-lg.border').filter({ hasText: `Card ending in ${last4}` });
}

const cardSubscription = subscriptionFor({ actions: ['cancel'], id: 'sub-card-1', payment_method: 'card', payment_provider: 'braintree', status: 'Active' });

test.describe('account billing', () => {
  test.describe('with saved cards', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        cards: [cardFor('4242', true), cardFor('1111')],
        subscriptions: [cardSubscription],
      },
    });

    test('shows which card renews the plan and what each card can do', async ({ page }) => {
      await open(page, '/home/billing');

      const renewal = cardRow(page, '4242');
      await expect(renewal).toContainText('Auto-renewal card');
      await expect(renewal.getByRole('button', { name: 'Re-authorize' })).toBeEnabled();
      await expect(renewal.getByRole('button', { name: 'Remove the card ending in 4242' })).toBeDisabled();

      const other = cardRow(page, '1111');
      await expect(other).not.toContainText('Auto-renewal card');
      await expect(other.getByRole('button', { name: 'Set for auto-renewal' })).toBeEnabled();
      await expect(other.getByRole('button', { name: 'Remove the card ending in 1111' })).toBeEnabled();
    });

    test('removes a card after asking', async ({ backend, page }) => {
      await open(page, '/home/billing');

      await cardRow(page, '1111').getByRole('button', { name: 'Remove the card ending in 1111' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Remove Saved Card');
      await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

      await expect(cardRow(page, '1111')).toHaveCount(0);
      await expect(cardRow(page, '4242')).toBeVisible();
      expect(backend.callsTo('DELETE', '/webapi/payment/btr/cards/').map(call => call.body)).toEqual([{ payment_token: 'card-1111' }]);
    });

    test('says so when removing a card fails, and keeps the card', async ({ page }) => {
      await page.route('**/webapi/payment/btr/cards/', async (route) => {
        if (route.request().method() === 'DELETE')
          await route.fulfill({ json: { message: 'This card cannot be removed right now' }, status: 400 });
        else
          await route.fallback();
      });
      await open(page, '/home/billing');

      await cardRow(page, '1111').getByRole('button', { name: 'Remove the card ending in 1111' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

      await expect(section(page, 'Payment method')).toContainText('This card cannot be removed right now');
      await expect(cardRow(page, '1111')).toBeVisible();
    });

    test('does not claim there are no cards when they fail to load, and can try again', async ({ page }) => {
      const failLoad = '**/webapi/payment/btr/cards/';
      await page.route(failLoad, async route => route.fulfill({ json: { message: 'Braintree is down' }, status: 500 }));
      await open(page, '/home/billing');

      const failure = page.locator('[data-cy="cards-load-failed"]');
      await expect(failure).toContainText('We couldn\'t load your saved cards.');
      await expect(section(page, 'Payment method')).not.toContainText('No saved cards');

      await page.unroute(failLoad);
      await failure.getByRole('button', { name: 'Try again' }).click();

      await expect(failure).toHaveCount(0);
      await expect(cardRow(page, '1111')).toBeVisible();
    });

    test('shows a failed re-authorization above the cards, where the refresh cannot cover it', async ({ page }) => {
      await page.route('**/webapi/2/braintree/customer', async route => route.fulfill({ json: { message: 'Braintree is down' }, status: 500 }));
      await open(page, '/home/billing');

      await cardRow(page, '4242').getByRole('button', { name: 'Re-authorize' }).click();

      const alert = section(page, 'Payment method').getByText('Error', { exact: true });
      await expect(alert).toBeVisible();
      const alertBox = await alert.boundingBox();
      const cardBox = await cardRow(page, '4242').boundingBox();
      expect(alertBox!.y).toBeLessThan(cardBox!.y);
    });
  });

  test.describe('when the credit balance fails to load', () => {
    test.use({ backendScenario: { account: subscriberAccount() } });

    test('does not claim a balance of zero', async ({ page }) => {
      await page.route('**/webapi/2/credit/', async route => route.fulfill({ json: { message: 'Down' }, status: 500 }));
      await open(page, '/home/billing');

      await expect(page.locator('[data-cy="credit-load-failed"]')).toContainText('We couldn\'t load your credit.');
      await expect(section(page, 'Refer a friend')).not.toContainText('0.00 €');
    });
  });

  test.describe('without any account credit', () => {
    test.use({ backendScenario: { account: subscriberAccount() } });

    test('shows a balance of zero for the backend\'s 404', async ({ page }) => {
      await open(page, '/home/billing');

      await expect(section(page, 'Refer a friend')).toContainText('0.00 €');
      await expect(page.locator('[data-cy="credit-load-failed"]')).toHaveCount(0);
    });
  });

  test.describe('with a subscription that offers several actions', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        cards: [cardFor('4242', true)],
        subscriptions: [subscriptionFor({ actions: ['cancel', 'upgrade'], id: 'sub-card-1', payment_method: 'card', payment_provider: 'braintree', status: 'Active' })],
      },
    });

    test('fits them in the table without scrolling sideways', async ({ page }) => {
      await page.setViewportSize({ height: 1000, width: 1280 });
      await open(page, '/home/billing');

      const subscriptions = section(page, 'Subscriptions');
      const cancel = subscriptions.getByRole('button', { name: 'Cancel subscription' });
      await expect(subscriptions.getByRole('button', { name: 'Upgrade plan' })).toBeVisible();
      await expect(cancel).toBeVisible();

      const tableBox = await page.locator('#subscriptions-table').boundingBox();
      const cancelBox = await cancel.boundingBox();
      expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(tableBox!.x + tableBox!.width);
    });
  });

  test.describe('with a saved card and no card payment yet', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        cards: [cardFor('1111')],
      },
    });

    test('still lists the card, so it can be removed', async ({ page }) => {
      await open(page, '/home/billing');

      await expect(cardRow(page, '1111').getByRole('button', { name: 'Remove the card ending in 1111' })).toBeEnabled();
    });
  });

  test.describe('with a crypto subscription and a saved card', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        cards: [cardFor('4242', true)],
        payments: [paymentFor()],
        subscriptions: [subscriptionFor({ actions: ['cancel'], payment_provider: 'crypto', status: 'Active' })],
      },
    });

    test('offers no card operations', async ({ page }) => {
      await open(page, '/home/billing');

      await expect(cardRow(page, '4242').getByRole('button', { name: 'Re-authorize' })).toBeDisabled();
    });
  });

  test.describe('with only an ended subscription', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptions: [subscriptionFor({ actions: [], is_active: false, next_action_date: 'Never', status: 'Cancelled' })],
      },
    });

    test('folds the subscriptions behind Show', async ({ page }) => {
      await open(page, '/home/billing');
      const subscriptions = section(page, 'Subscriptions');

      await expect(subscriptions).toContainText('One past subscription, nothing to act on.');
      await expect(subscriptions.getByRole('table')).toHaveCount(0);

      await subscriptions.getByRole('button', { name: 'Show', exact: true }).click();
      await expect(subscriptions.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect(subscriptions.getByRole('table')).toContainText('Cancelled');
      await expect(subscriptions.getByRole('button', { name: 'Hide', exact: true })).toBeVisible();
    });
  });

  test.describe('with an active and an ended subscription', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptions: [
          cardSubscription,
          subscriptionFor({ actions: [], id: 'sub-old', is_active: false, next_action_date: 'Never', plan_name: 'Basic', status: 'Cancelled' }),
        ],
      },
    });

    test('lists both and cancels the active one from its row', async ({ backend, page }) => {
      await open(page, '/home/billing');
      const table = section(page, 'Subscriptions').getByRole('table');
      await expect(table.locator('tbody tr')).toHaveCount(2);

      await table.getByRole('button', { name: 'Cancel subscription' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('You won\'t be charged again. Your plan stays active until');
      await expect(dialog.locator('[data-cy="cancellation-consequences"]')).toContainText('Your data stays on your computer.');
      await expect(dialog).toContainText('We e-mail you a confirmation of the cancellation.');
      // Basic is the cheapest paid plan here, so there is nothing cheaper to suggest.
      await expect(dialog.locator('[data-cy="cancellation-cheaper-plan"]')).toHaveCount(0);
      await expect(dialog.getByRole('button', { name: 'Cancel subscription', exact: true })).toBeDisabled();

      await page.getByText('Too expensive', { exact: true }).click();
      await dialog.getByRole('button', { name: 'Cancel subscription', exact: true }).click();

      await expect(table.getByRole('button', { name: 'Resume subscription' })).toBeVisible();
      expect(backend.callsTo('DELETE', '/webapi/2/subscriptions/sub-card-1/')).toHaveLength(1);
    });

    test('keeps the plan when the buyer changes their mind', async ({ backend, page }) => {
      await open(page, '/home/billing');
      const table = section(page, 'Subscriptions').getByRole('table');

      await table.getByRole('button', { name: 'Cancel subscription' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Keep my plan', exact: true }).click();

      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(table.getByRole('button', { name: 'Cancel subscription' })).toBeVisible();
      expect(backend.callsTo('DELETE', '/webapi/2/subscriptions/sub-card-1/')).toHaveLength(0);
    });
  });

  test.describe('cancelling a plan that has a cheaper one', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptions: [subscriptionFor({ actions: ['cancel'], id: 'sub-advanced', payment_method: 'card', payment_provider: 'braintree', plan_name: 'Advanced', status: 'Active' })],
      },
    });

    test('suggests subscribing to the cheaper plan once this one ends', async ({ page }) => {
      await open(page, '/home/billing');

      await section(page, 'Subscriptions').getByRole('table').getByRole('button', { name: 'Cancel subscription' }).click();

      await expect(page.getByRole('dialog').locator('[data-cy="cancellation-cheaper-plan"]'))
        .toContainText('you can subscribe to Basic for 25.00 € per month');
    });
  });

  test.describe('when the backend task fails', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptionTask: 'failed',
        subscriptions: [
          cardSubscription,
          subscriptionFor({ actions: [], id: 'sub-soft', is_soft_canceled: true, plan_name: 'Basic', status: 'Cancelled but still active' }),
        ],
      },
    });

    test('says the cancellation failed and keeps the subscription', async ({ page }) => {
      await open(page, '/home/billing');
      const table = section(page, 'Subscriptions').getByRole('table');

      await table.getByRole('button', { name: 'Cancel subscription' }).click();
      await page.getByText('Too expensive', { exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel subscription', exact: true }).click();

      await expect(page.getByText('Could not cancel your subscription')).toBeVisible();
      await expect(page.getByText('The payment provider did not answer')).toBeVisible();
      await expect(table.getByRole('button', { name: 'Cancel subscription' })).toBeVisible();
    });

    test('says the resume failed instead of claiming it worked', async ({ page }) => {
      await open(page, '/home/billing');
      const table = section(page, 'Subscriptions').getByRole('table');

      await table.getByRole('button', { name: 'Resume subscription' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Resume subscription', exact: true }).click();

      await expect(page.getByText('Could not resume your subscription')).toBeVisible();
      await expect(page.getByText('The payment provider did not answer')).toBeVisible();
      await expect(table.getByRole('button', { name: 'Resume subscription' })).toBeVisible();
    });
  });

  test.describe('with account credit', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        credit: creditWithHistory(),
      },
    });

    test('opens the credit history with each entry signed', async ({ page }) => {
      await open(page, '/home/billing');
      await expect(section(page, 'Refer a friend')).toContainText('12.50 €');

      await section(page, 'Refer a friend').getByRole('button', { name: 'Credit history' }).click();
      const dialog = page.getByRole('dialog');
      const rows = dialog.getByRole('table').locator('tbody tr');
      await expect(rows).toHaveCount(3);
      await expect(dialog).toContainText('+10.00 €');
      await expect(dialog).toContainText('-7.50 €');
      await expect(dialog).toContainText('Referral Reward');

      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(dialog).toHaveCount(0);
    });
  });
});
