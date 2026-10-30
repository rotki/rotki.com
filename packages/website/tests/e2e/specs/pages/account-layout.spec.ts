import { expect, type Page } from '@playwright/test';
import { defaultAccount, subscriberAccount, subscriptionFor } from '../../support/backend-data';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForHydration(page);
}

function main(page: Page) {
  return page.getByRole('main');
}

test.describe('account layout', () => {
  test('names the account in the sidebar and titles each tab', async ({ page }) => {
    await open(page, '/home/account-details');

    await expect(main(page).getByText('Test User', { exact: true })).toBeVisible();
    await expect(main(page).getByText('test@example.com', { exact: true })).toBeVisible();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
    await expect(main(page).getByText('How you sign in, what we e-mail you, and closing your account.')).toBeVisible();
    for (const section of ['Sign-in details', 'Change Password', 'E-mail preferences', 'Delete account'])
      await expect(main(page).getByRole('heading', { level: 2, name: section })).toBeVisible();

    const nav = main(page).getByRole('navigation', { name: 'Account' }).first();
    await expect(nav.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Devices & API' }).click();
    await expect(page).toHaveURL(/\/home\/devices/);
    await expect(main(page).getByRole('heading', { level: 1, name: 'Devices & API' })).toBeVisible();
    await expect(main(page).getByRole('heading', { level: 2, name: 'Devices' })).toBeVisible();
  });

  for (const [from, to, title] of [
    ['/home/saved-cards', '/home/billing', 'Billing'],
    ['/home/customer-information', '/home/billing', 'Billing'],
    ['/home/address', '/home/billing', 'Billing'],
    ['/home/email-preferences', '/home/account-details', 'Account'],
  ] as const) {
    test(`${from} opens ${to}`, async ({ page }) => {
      await page.goto(from);

      await page.waitForURL(`**${to}`);
      await expect(main(page).getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test.describe('without a name on the account', () => {
    test.use({
      backendScenario: {
        account: { ...defaultAccount(), address: { ...defaultAccount().address, first_name: '', last_name: '' } },
      },
    });

    test('shows the username instead', async ({ page }) => {
      await open(page, '/home/devices');

      await expect(main(page).getByText('testuser', { exact: true })).toBeVisible();
    });
  });

  test.describe('with an unconfirmed e-mail address', () => {
    test.use({ backendScenario: { account: { ...defaultAccount(), email_confirmed: false } } });

    test('asks to confirm it on every tab', async ({ page }) => {
      for (const path of ['/home/subscription', '/home/devices']) {
        await open(page, path);
        await expect(page.getByRole('status').filter({ hasText: 'has not been verified' })).toBeVisible();
      }
    });

    test('offers no plan or credit before it is confirmed', async ({ page }) => {
      await open(page, '/home/subscription');

      const plan = main(page).getByRole('region', { name: 'Your plan' });
      await expect(plan.getByText('Confirm your e-mail address to choose a plan.', { exact: false })).toBeVisible();
      await expect(main(page).getByRole('button', { name: /Upgrade Now/ })).toHaveCount(0);
      await expect(main(page).getByText('Available Credit')).toHaveCount(0);
    });
  });

  test('opens Billing with a full page load, which brings its card CSP', async ({ page }) => {
    await open(page, '/home/devices');

    const load = page.waitForRequest(request => request.isNavigationRequest() && new URL(request.url()).pathname === '/home/billing');
    await main(page).getByRole('navigation', { name: 'Account' }).first().getByRole('link', { name: 'Billing' }).click();
    await load;
    await expect(main(page).getByRole('heading', { level: 1, name: 'Billing' })).toBeVisible();
  });

  test('reloads into Billing when the app itself goes to an old card path', async ({ page }) => {
    await open(page, '/home/devices');

    const load = page.waitForRequest(request => request.isNavigationRequest() && new URL(request.url()).pathname === '/home/billing');
    // Vue Router handles a popstate as an in-app navigation, like a NuxtLink click
    await page.evaluate(() => {
      window.history.pushState({}, '', '/home/saved-cards');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await load;
    await page.waitForURL('**/home/billing');
  });

  test.describe('with a subscription', () => {
    test.use({
      backendScenario: {
        account: subscriberAccount(),
        subscriptions: [subscriptionFor({ actions: [], status: 'Active' })],
      },
    });

    test('replaces the plan skeleton with the subscription once it loads', async ({ page }) => {
      await open(page, '/home/subscription');

      await expect(main(page).getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
      const plan = main(page).getByRole('region', { name: 'Your plan' });
      await expect(plan.getByText(/Basic/).first()).toBeVisible();
      await expect(plan.locator('[data-id=skeleton]')).toHaveCount(0);
    });
  });
});
