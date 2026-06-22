import type { CryptoPayment } from '~/types';
import { describe, expect, it } from 'vitest';
import { buildPaymentUri } from '~/modules/web3/core/payment-uri';

function makePayment(overrides: Partial<CryptoPayment>): CryptoPayment {
  return {
    chainId: 1,
    chainName: 'ethereum',
    cryptoAddress: '0xRecipient',
    cryptocurrency: 'ETH',
    decimals: 18,
    durationInMonths: 12,
    finalPriceInCrypto: 1,
    finalPriceInEur: 100,
    firstPayment: true,
    hoursForPayment: 24,
    months: 12,
    numberOfMonths: 12,
    startDate: null,
    subscriptionId: 'sub-1',
    transactionStarted: false,
    vat: 0,
    ...overrides,
  };
}

describe('web3 core/payment-uri', () => {
  it('builds a BIP-21 uri for bitcoin', async () => {
    const uri = await buildPaymentUri(makePayment({
      chainName: 'bitcoin',
      cryptoAddress: 'bc1qexample',
      finalPriceInCrypto: 0.5,
    }));
    expect(uri).toBe('bitcoin:bc1qexample?amount=0.5&label=Rotki');
  });

  it('builds an EIP-681 native-value uri when the token is native', async () => {
    const uri = await buildPaymentUri(makePayment({
      chainId: 1,
      cryptoAddress: '0xRecipient',
      decimals: 18,
      finalPriceInCrypto: 1,
      tokenAddress: undefined,
    }));
    expect(uri).toBe('ethereum:0xRecipient@1?value=1000000000000000000');
  });

  it('builds an EIP-681 ERC20 transfer uri for a token', async () => {
    const uri = await buildPaymentUri(makePayment({
      chainId: 1,
      cryptoAddress: '0xRecipient',
      decimals: 6,
      finalPriceInCrypto: 1,
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    }));
    expect(uri).toBe('ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48@1/transfer?address=0xRecipient&uint256=1000000');
  });
});
