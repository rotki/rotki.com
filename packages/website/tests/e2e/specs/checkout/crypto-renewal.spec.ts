import type { BackendScenario } from '../../support/backend';
import { expect } from '@playwright/test';
import {
  cryptoPaymentFor,
  ETH_ON_ETHEREUM,
  pendingSubscription,
  RECEIVING_ADDRESS,
  renewableSubscription,
  RENEWAL_SUBSCRIPTION_ID,
  subscriberAccount,
  USDC_ON_BASE,
} from '../../support/backend-data';
import {
  acceptPolicyAndContinue,
  changePaymentMethod,
  changePlan,
  confirmPaymentChange,
  connectWallet,
  expectPendingSuccess,
  payWithWallet,
  selectAsset,
  switchNetwork,
} from '../../support/checkout';
import { test } from '../../support/fixtures';
import { tokenBalanceFor } from '../../support/rpc';

/** ERC-20 `transfer(address,uint256)`, the call a token payment sends. */
const TRANSFER_SELECTOR = '0xa9059cbb';

const RENEWAL_QUERY = `planId=3&id=${RENEWAL_SUBSCRIPTION_ID}`;

/** The renewal payment the backend hands out for the Basic monthly plan. */
function renewalPayment(): ReturnType<typeof cryptoPaymentFor> {
  return cryptoPaymentFor(ETH_ON_ETHEREUM, { first_payment: false, subscription_id: RENEWAL_SUBSCRIPTION_ID });
}

/** The same renewal, repriced in USDC on Base. */
function basePayment(): ReturnType<typeof cryptoPaymentFor> {
  return cryptoPaymentFor(USDC_ON_BASE, { first_payment: false, subscription_id: RENEWAL_SUBSCRIPTION_ID });
}

/**
 * A backend holding one subscription due for renewal.
 *
 * @remarks
 * `test.use` replaces an option instead of merging it, so a nested describe that needs one more
 * setting builds its scenario from here rather than declaring a bare override.
 */
function renewalScenario(overrides: Partial<BackendScenario> = {}): Partial<BackendScenario> {
  return {
    account: subscriberAccount(),
    payment: renewalPayment(),
    subscriptions: [renewableSubscription()],
    ...overrides,
  };
}

test.describe('crypto renewal', () => {
  test.use({
    backendScenario: renewalScenario(),
    chainScenario: { tokenBalances: tokenBalanceFor(USDC_ON_BASE, '100') },
  });

  test('renews the existing subscription with ETH', async ({ backend, page, wallet }) => {
    await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

    await selectAsset(page, 'Ethereum', 'ETH (Ether)');
    await acceptPolicyAndContinue(page);

    await connectWallet(page, wallet);
    await payWithWallet(page);

    await expectPendingSuccess(page);

    expect(backend.callsTo('POST', '/webapi/2/crypto/payments')[0]?.body).toMatchObject({
      cryptocurrency_identifier: 'ethereum:ETH',
      plan_id: 3,
      subscription_id: RENEWAL_SUBSCRIPTION_ID,
    });
    const [transaction] = await wallet.sentTransactions();
    expect(transaction?.to.toLowerCase()).toBe(RECEIVING_ADDRESS);
  });

  test.describe('changing the token and chain', () => {
    test('repays on the new chain after switching the wallet over', async ({ backend, page, wallet }) => {
      await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

      await selectAsset(page, 'Ethereum', 'ETH (Ether)');
      await acceptPolicyAndContinue(page);

      backend.update({ payment: basePayment() });
      await changePaymentMethod(page);
      expect(backend.callsTo('DELETE', '/webapi/2/crypto/payment/pending/')).toHaveLength(1);

      await selectAsset(page, 'Base', 'USDC');
      await acceptPolicyAndContinue(page);

      await connectWallet(page, wallet);
      await switchNetwork(page);
      await payWithWallet(page);

      await expectPendingSuccess(page);

      const requests = await wallet.requests();
      expect(requests.filter(request => request.method === 'wallet_switchEthereumChain')).not.toHaveLength(0);
      const [transaction] = await wallet.sentTransactions();
      expect(transaction?.to.toLowerCase()).toBe(USDC_ON_BASE.address?.toLowerCase());
      expect(transaction?.data?.startsWith(TRANSFER_SELECTOR)).toBe(true);
      expect(backend.callsTo('POST', '/webapi/2/crypto/payments').at(-1)?.body).toMatchObject({ cryptocurrency_identifier: 'base:USDC' });
    });

    test.describe('when the wallet does not know the chain yet', () => {
      test.use({ walletOverrides: { behavior: { switchChain: 'unrecognized' } } });

      test('adds the chain before paying on it', async ({ backend, page, wallet }) => {
        backend.update({ payment: basePayment() });
        await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

        await selectAsset(page, 'Base', 'USDC');
        await acceptPolicyAndContinue(page);

        await connectWallet(page, wallet);
        await switchNetwork(page);
        await payWithWallet(page);

        await expectPendingSuccess(page);

        const requests = await wallet.requests();
        expect(requests.filter(request => request.method === 'wallet_addEthereumChain')).not.toHaveLength(0);
      });
    });

    test.describe('when the wallet refuses to switch', () => {
      test.use({ walletOverrides: { behavior: { switchChain: 'reject' } } });

      test('reports the failure and keeps offering the switch', async ({ backend, page, wallet }) => {
        backend.update({ payment: basePayment() });
        await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

        await selectAsset(page, 'Base', 'USDC');
        await acceptPolicyAndContinue(page);

        await connectWallet(page, wallet);
        await switchNetwork(page);

        await expect(page.getByText('Payment Failure')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Switch Network' })).toBeVisible();
        expect(await wallet.sentTransactions()).toHaveLength(0);
      });
    });
  });

  test.describe('changing the plan', () => {
    test('recreates the payment for the new plan', async ({ backend, page, wallet }) => {
      await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

      await selectAsset(page, 'Ethereum', 'ETH (Ether)');
      await acceptPolicyAndContinue(page);

      await changePlan(page, { period: 'Yearly billing', tier: 'Basic' });

      await expect(page).toHaveURL(/planId=4/);
      /* The URL changes first and the payment is recreated after, so wait for the new payment
         rather than reading the calls the moment the plan card is clicked. */
      await expect.poll(() => backend.callsTo('POST', '/webapi/2/crypto/payments').at(-1)?.body).toMatchObject({
        plan_id: 4,
        subscription_id: RENEWAL_SUBSCRIPTION_ID,
      });
      expect(backend.callsTo('DELETE', '/webapi/2/crypto/payment/pending/')).toHaveLength(1);

      await connectWallet(page, wallet);
      await payWithWallet(page);

      await expectPendingSuccess(page);
    });

    test('resumes the pending payment after a detour through the subscription page', async ({ backend, page, wallet }) => {
      await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

      await selectAsset(page, 'Ethereum', 'ETH (Ether)');
      await acceptPolicyAndContinue(page);

      await changePlan(page, { period: 'Yearly billing', tier: 'Basic' });
      await expect(page).toHaveURL(/planId=4/);
      await expect.poll(() => backend.callsTo('POST', '/webapi/2/crypto/payments').at(-1)?.body).toMatchObject({ plan_id: 4 });

      /* From here the backend has a payment waiting, which is what sends the user back into
         checkout instead of letting them start over. */
      backend.update({
        pending: { currency: 'ethereum:ETH', pending: true },
        subscriptions: [pendingSubscription({ duration_in_months: 12, plan_id: 4 })],
      });

      await page.goto('/home/subscription');
      await expect(page).toHaveURL(/\/home\/subscription/);

      await page.goto(`/checkout/pay/request-crypto?planId=4&id=${RENEWAL_SUBSCRIPTION_ID}`);
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      await expect(page).toHaveURL(/currency=ethereum:ETH/);

      await changePlan(page, { period: 'Monthly Billing', tier: 'Basic' });
      await expect(page).toHaveURL(/planId=3/);

      backend.update({ payment: basePayment() });
      await changePaymentMethod(page);

      await selectAsset(page, 'Base', 'USDC');
      await acceptPolicyAndContinue(page);

      await connectWallet(page, wallet);
      await switchNetwork(page);
      await payWithWallet(page);

      await expectPendingSuccess(page);

      const [transaction] = await wallet.sentTransactions();
      expect(transaction?.to.toLowerCase()).toBe(USDC_ON_BASE.address?.toLowerCase());
      expect(backend.callsTo('POST', '/webapi/2/crypto/payments').at(-1)?.body).toMatchObject({ cryptocurrency_identifier: 'base:USDC', plan_id: 3 });
    });
  });

  test.describe('when cancelling the pending payment fails', () => {
    test.use({ backendScenario: renewalScenario({ deletePending: { status: 500 } }) });

    test('says the cancellation failed and stays on the payment', async ({ page }) => {
      await page.goto(`/checkout/pay/request-crypto?${RENEWAL_QUERY}`);

      await selectAsset(page, 'Ethereum', 'ETH (Ether)');
      await acceptPolicyAndContinue(page);

      await confirmPaymentChange(page);

      await expect(page.getByText('Cancellation Failed')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
    });
  });
});
