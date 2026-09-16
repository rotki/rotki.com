import { expect } from '@playwright/test';
import { cryptoPaymentFor, RECEIVING_ADDRESS, USDC_ON_ETHEREUM } from '../../support/backend-data';
import {
  acceptPolicyAndContinue,
  connectWallet,
  expectPendingSuccess,
  payWithWallet,
  selectAsset,
} from '../../support/checkout';
import { test } from '../../support/fixtures';
import { tokenBalanceFor } from '../../support/rpc';

test.describe('new crypto payment', () => {
  test('pays with ETH from an injected wallet and lands on the pending success page', async ({ backend, chain, page, wallet }) => {
    await page.goto('/checkout/pay/request-crypto?planId=3');

    await selectAsset(page, 'Ethereum', 'ETH (Ether)');
    await acceptPolicyAndContinue(page);

    await expect(page.locator('#price')).toHaveValue('0.01 ETH');

    await connectWallet(page, wallet);
    await payWithWallet(page);

    await expectPendingSuccess(page);

    expect(backend.callsTo('POST', '/webapi/2/crypto/payments')[0]?.body).toMatchObject({ cryptocurrency_identifier: 'ethereum:ETH', plan_id: 3 });
    const [transaction] = await wallet.sentTransactions();
    expect(transaction?.to.toLowerCase()).toBe(RECEIVING_ADDRESS);
    expect(BigInt(transaction?.value ?? '0')).toBe(10n ** 16n);
    expect(backend.callsTo('PATCH', '/webapi/2/crypto/payment/pending/')).toHaveLength(1);
    expect(chain.requests.filter(request => request.chainId === 1 && request.method === 'eth_call')).not.toHaveLength(0);
    expect(backend.unhandled.map(call => `${call.method} ${call.path}`)).toEqual([]);
  });

  test.describe('when the backend refuses to create the payment', () => {
    test.use({ backendScenario: { createPayment: { message: 'This plan is no longer available', status: 400 } } });

    test('shows the backend message and stays on the payment page', async ({ backend, page }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await expect(page.getByText('Payment Failure')).toBeVisible();
      await expect(page.getByText('This plan is no longer available')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      expect(backend.callsTo('POST', '/webapi/2/crypto/payments')).toHaveLength(1);
    });
  });

  test.describe('when the account e-mail is unverified', () => {
    test.use({ backendScenario: { createPayment: { status: 403 } } });

    test('explains that the e-mail has to be verified first', async ({ page }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await expect(page.getByText('You need to first verify your e-mail address.')).toBeVisible();
    });
  });

  test.describe('when the backend fails unexpectedly', () => {
    test.use({ backendScenario: { createPayment: { status: 500 } } });

    test('reports a payment failure without sending the user away', async ({ page }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await expect(page.getByText('Payment Failure')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
    });
  });

  test.describe('when the wallet rejects the connection', () => {
    test.use({ walletOverrides: { behavior: { connect: 'reject' } } });

    test('keeps the picker open with the rejection message', async ({ page, wallet }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await connectWallet(page, wallet);

      await expect(page.getByText('Request rejected. Please try again.')).toBeVisible();
      await expect(page.getByRole('button', { name: wallet.options.name })).toBeVisible();
      expect(await wallet.sentTransactions()).toHaveLength(0);
    });
  });

  test.describe('when the wallet rejects the transaction', () => {
    test.use({ walletOverrides: { behavior: { sendTransaction: 'reject' } } });

    test('reports the rejection and keeps the payment open', async ({ backend, page, wallet }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await connectWallet(page, wallet);
      await payWithWallet(page);

      await expect(page.getByText('Request rejected. Please try again.')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      expect(backend.callsTo('PATCH', '/webapi/2/crypto/payment/pending/')).toHaveLength(0);
    });
  });

  test.describe('when the wallet cannot cover the gas', () => {
    test.use({ walletOverrides: { behavior: { sendTransaction: 'insufficientFunds' } } });

    /*
     * viem rewrites the node's "insufficient funds for gas * price + value" into its own
     * balance wording, which `classifyCryptoTxError` does not match, so the buyer is told the
     * transaction failed rather than that the funds fell short. Asserted as-is; the pre-flight
     * balance check above is what actually warns the buyer before they pay.
     */
    test('reports the failure and keeps the payment open', async ({ backend, page, wallet }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await connectWallet(page, wallet);
      await payWithWallet(page);

      await expect(page.getByText('The transaction failed. Please try again.')).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      expect(backend.callsTo('PATCH', '/webapi/2/crypto/payment/pending/')).toHaveLength(0);
    });
  });

  test.describe('when the token balance is below the price', () => {
    test.use({
      backendScenario: { payment: cryptoPaymentFor(USDC_ON_ETHEREUM) },
      chainScenario: { tokenBalances: tokenBalanceFor(USDC_ON_ETHEREUM, '1') },
    });

    test('blocks paying and explains why', async ({ page, wallet }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:USDC');

      await connectWallet(page, wallet);

      await expect(page.getByText('balance is not enough to cover this payment')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pay with wallet' })).toBeDisabled();
      expect(await wallet.sentTransactions()).toHaveLength(0);
    });
  });
});
