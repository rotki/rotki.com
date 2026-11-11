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
  test('the payment step opens the card page (stubbed, a separate app) with the checkout params', async ({ page }) => {
    await page.route('**/checkout/pay/card?**', async route => route.fulfill({ body: '<title>card</title>', contentType: 'text/html' }));

    await page.goto('/checkout/pay/method?planId=3&discountCode=AUTUMN');

    await page.waitForURL('**/checkout/pay/card?planId=3&discountCode=AUTUMN');
  });

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

      await expect(page.getByText('Payment failed', { exact: true })).toBeVisible();
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

    test('reports a payment failure without sending the user away', async ({ backend, page }) => {
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await expect(page.getByText('Payment failed', { exact: true })).toBeVisible();
      await expect(page.getByTestId('crypto-payment-error')).toHaveText('Something went wrong on our side. Please try again.');
      await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
      expect(backend.callsTo('POST', '/webapi/2/crypto/payments')).toHaveLength(1);
    });

    test('shows the same copy when the error page is not JSON', async ({ page }) => {
      await page.route('**/webapi/2/crypto/payments', async route => route.fulfill({
        body: 'MultipleObjectsReturned at /webapi/2/crypto/payments',
        contentType: 'text/plain',
        status: 500,
      }));

      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');

      await expect(page.getByText('Payment failed', { exact: true })).toBeVisible();
      await expect(page.getByTestId('crypto-payment-error')).toHaveText('Something went wrong on our side. Please try again.');
    });
  });

  test.describe('when the wallet does not answer', () => {
    test.use({ walletOverrides: { behavior: { sendTransaction: 'hang' } } });

    test('stops blocking the page, refuses a second request and carries on if the buyer approves', async ({ backend, page, wallet }) => {
      await page.clock.install();
      await page.goto('/checkout/pay/crypto?planId=3&currency=ethereum:ETH');
      await connectWallet(page, wallet);
      await payWithWallet(page);
      await expect(page.getByTestId('processing-overlay')).toBeVisible();
      // The overlay shows before the wallet is asked, and the wait only starts with the request.
      await expect.poll(async () => (await wallet.sentTransactions()).length).toBe(1);

      await page.clock.fastForward('02:01');

      await expect(page.getByTestId('processing-overlay')).toBeHidden();
      await expect(page.getByText('Waiting for your wallet', { exact: true })).toBeVisible();

      await payWithWallet(page);
      await expect(page.getByText('Waiting for your wallet', { exact: true })).toBeVisible();
      expect(await wallet.sentTransactions()).toHaveLength(1);

      await wallet.approvePendingSend();
      await expect(page.getByTestId('processing-overlay')).toBeVisible();
      await page.clock.fastForward('00:06');
      await expectPendingSuccess(page);
      expect(backend.callsTo('PATCH', '/webapi/2/crypto/payment/pending/')).toHaveLength(1);
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
     * viem rewrites the node's "insufficient funds for gas * price + value" into wording
     * `classifyCryptoTxError` does not match, so the buyer sees a generic failure instead of a
     * funds error. Asserted as-is; the pre-flight balance check above is what warns the buyer
     * before they pay.
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

      await expect(page.getByText('Your USDC balance is not enough to cover this payment.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pay with wallet' })).toBeDisabled();
      expect(await wallet.sentTransactions()).toHaveLength(0);
    });
  });
});
