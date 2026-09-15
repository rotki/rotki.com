import { expect } from '@playwright/test';
import { RECEIVING_ADDRESS } from '../../support/backend-data';
import {
  acceptPolicyAndContinue,
  connectWallet,
  expectPendingSuccess,
  payWithWallet,
  selectAsset,
} from '../../support/checkout';
import { test } from '../../support/fixtures';

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
});
