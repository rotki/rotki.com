import type { BackendScenario } from '../../support/backend';
import { expect, type Page } from '@playwright/test';
import {
  cryptoPaymentFor,
  defaultUpgradePayment,
  ETH_ON_ETHEREUM,
  subscriberAccount,
  upgradableSubscription,
  UPGRADE_SUBSCRIPTION_ID,
  upgradeRequestedSubscription,
} from '../../support/backend-data';
import {
  acceptPolicyAndContinue,
  confirmPaymentChange,
  connectWallet,
  expectPendingSuccess,
  payWithWallet,
  selectAsset,
} from '../../support/checkout';
import { test } from '../../support/fixtures';

const UPGRADE_QUERY = `planId=1&upgradeSubId=${UPGRADE_SUBSCRIPTION_ID}`;

/** The payment the backend hands out for upgrading Basic to Advanced. */
function upgradePayment(): ReturnType<typeof cryptoPaymentFor> {
  return cryptoPaymentFor(ETH_ON_ETHEREUM, { first_payment: false, subscription_id: UPGRADE_SUBSCRIPTION_ID });
}

/**
 * A backend with one running subscription that may be upgraded.
 *
 * @remarks
 * `test.use` replaces an option instead of merging it, so nested describes build on this rather
 * than declaring a bare override.
 */
function upgradeScenario(overrides: Partial<BackendScenario> = {}): Partial<BackendScenario> {
  return {
    account: subscriberAccount(),
    payment: upgradePayment(),
    subscriptions: [upgradableSubscription()],
    ...overrides,
  };
}

/**
 * Picks a higher tier in the upgrade dialog on the subscription page and continues to checkout.
 *
 * @remarks
 * The subscriptions table can briefly hold two copies of the row's actions while it settles, so
 * the action is taken by its first match rather than a strict one.
 */
async function startUpgrade(page: Page, tier: string): Promise<void> {
  await page.getByRole('button', { name: 'Upgrade plan' }).first().click();
  await expect(page.getByText('Upgrade Your Plan')).toBeVisible();
  await page.getByText(`${tier} plan`, { exact: true }).click();
  await page.getByRole('button', { name: 'Upgrade', exact: true }).click();
}

test.describe('crypto upgrade', () => {
  test.use({ backendScenario: upgradeScenario() });

  test('upgrades the subscription from the subscription page', async ({ backend, page, wallet }) => {
    await page.goto('/home/subscription');

    await startUpgrade(page, 'Advanced');

    await expect(page).toHaveURL(new RegExp(`/checkout/pay/request-crypto\\?.*upgradeSubId=${UPGRADE_SUBSCRIPTION_ID}`));
    await selectAsset(page, 'Ethereum', 'ETH (Ether)');
    await acceptPolicyAndContinue(page);

    // An upgrade is tied to the plan it was requested for, so the order summary offers no switch.
    await expect(page.getByText('Prorated price:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change', exact: true })).toBeHidden();

    await connectWallet(page, wallet);
    await payWithWallet(page);

    await expectPendingSuccess(page);

    expect(backend.callsTo('POST', '/webapi/2/crypto/upgrade').at(-1)?.body).toMatchObject({
      cryptocurrency_identifier: 'ethereum:ETH',
      plan_id: 1,
      subscription_id: UPGRADE_SUBSCRIPTION_ID,
    });
    expect(backend.callsTo('POST', '/webapi/2/crypto/payments')).toHaveLength(0);
    expect(backend.callsTo('PATCH', '/webapi/2/crypto/payment/upgrade/')).toHaveLength(1);
  });

  test('cancels the upgrade request and returns to the subscription page', async ({ backend, page }) => {
    await page.goto(`/checkout/pay/crypto?${UPGRADE_QUERY}&currency=ethereum:ETH`);

    await confirmPaymentChange(page);

    await expect(page).toHaveURL(/\/home\/subscription/);
    expect(backend.callsTo('POST', '/webapi/2/crypto/upgrade/cancel').at(-1)?.body).toMatchObject({
      subscription_id: UPGRADE_SUBSCRIPTION_ID,
    });
    expect(backend.callsTo('DELETE', '/webapi/2/crypto/payment/pending/')).toHaveLength(0);
  });

  test.describe('with an upgrade already awaiting payment', () => {
    test.use({
      backendScenario: upgradeScenario({
        subscriptions: [upgradeRequestedSubscription()],
        upgrade: { ...defaultUpgradePayment(), currency: 'ethereum:ETH', pending: true },
      }),
    });

    test('sends the user back to the upgrade payment', async ({ page }) => {
      await page.goto(`/checkout/pay/request-crypto?${UPGRADE_QUERY}`);

      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      await expect(page).toHaveURL(new RegExp(`upgradeSubId=${UPGRADE_SUBSCRIPTION_ID}`));
      await expect(page).toHaveURL(/planId=1/);
      await expect(page).toHaveURL(/currency=ethereum:ETH/);
    });
  });

  test.describe('with an upgrade whose transaction is already on its way', () => {
    test.use({
      backendScenario: upgradeScenario({
        subscriptions: [upgradeRequestedSubscription()],
        upgrade: { ...defaultUpgradePayment(), pending: true, transaction_started: true },
      }),
    });

    test('sends the user to the subscription page instead of paying twice', async ({ backend, page }) => {
      await page.goto(`/checkout/pay/request-crypto?${UPGRADE_QUERY}`);

      await expect(page).toHaveURL(/\/home\/subscription/);
      expect(backend.callsTo('POST', '/webapi/2/crypto/upgrade')).toHaveLength(0);
    });
  });

  test.describe('when the payment was already started', () => {
    test.use({
      backendScenario: upgradeScenario({
        payment: cryptoPaymentFor(ETH_ON_ETHEREUM, { subscription_id: UPGRADE_SUBSCRIPTION_ID, transaction_started: true }),
      }),
    });

    test('goes straight to the pending success page', async ({ page, wallet }) => {
      await page.goto(`/checkout/pay/crypto?${UPGRADE_QUERY}&currency=ethereum:ETH`);

      await expectPendingSuccess(page);
      expect(await wallet.sentTransactions()).toHaveLength(0);
    });
  });

  test.describe('when the backend refuses the upgrade', () => {
    test.use({ backendScenario: upgradeScenario({ createUpgrade: { message: 'Upgrade is not available', status: 400 } }) });

    test('shows the backend message and stays on the payment page', async ({ page }) => {
      await page.goto(`/checkout/pay/crypto?${UPGRADE_QUERY}&currency=ethereum:ETH`);

      await expect(page.getByText('Upgrade is not available')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
    });
  });
});
