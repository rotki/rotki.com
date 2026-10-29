import { describe, expect, it } from 'vitest';
import { CryptoPaymentResponse, PaymentAssetResponse } from '~/types';
import { localIconUrl } from '~/utils/token-icons';

const DATA = 'https://raw.githubusercontent.com/rotki/data';

describe('localIconUrl', () => {
  it('should rewrite a branch ref to the go server', () => {
    expect(localIconUrl(`${DATA}/refs/heads/develop/assets/icons/dai.png`)).toBe('/api/icons/dai.png');
    expect(localIconUrl(`${DATA}/main/assets/icons/eure.png`)).toBe('/api/icons/eure.png');
  });

  it('should rewrite a commit ref to the go server', () => {
    expect(localIconUrl(`${DATA}/b104c8ca91a5febd6ca1c93e79ffcb7072326a41/assets/icons/btc.png`)).toBe('/api/icons/btc.png');
  });

  it('should accept the same filename lengths as the go server', () => {
    const longest = `${'a'.repeat(64)}.png`;
    expect(localIconUrl(`${DATA}/main/assets/icons/${longest}`)).toBe(`/api/icons/${longest}`);
    expect(localIconUrl(`${DATA}/main/assets/icons/${'a'.repeat(65)}.png`)).toBeUndefined();
  });

  it('should drop rotki/data urls the go server cannot serve', () => {
    for (const url of [
      `${DATA}/main/constants/asset-mappings.json`,
      `${DATA}/main/assets/icons/sub/eth.png`,
      `${DATA}/main/assets/icons/eth.png?raw=1`,
      `${DATA}/main/assets/images/eth.png`,
    ])
      expect(localIconUrl(url)).toBeUndefined();
  });

  it('should leave other urls unchanged', () => {
    for (const url of [
      '/img/eth.png',
      'https://example.com/rotki/data/main/assets/icons/eth.png',
      'https://raw.githubusercontent.com/rotki/rotki/main/assets/icons/eth.png',
    ])
      expect(localIconUrl(url)).toBe(url);
  });

  it('should treat a missing url as no icon', () => {
    expect(localIconUrl('')).toBeUndefined();
    expect(localIconUrl(null)).toBeUndefined();
    expect(localIconUrl(undefined)).toBeUndefined();
  });
});

describe('icon urls in api schemas', () => {
  it('should rewrite payment asset icons', () => {
    const parsed = PaymentAssetResponse.parse({
      bitcoin: {
        'bitcoin:BTC': {
          iconUrl: `${DATA}/b104c8ca91a5febd6ca1c93e79ffcb7072326a41/assets/icons/btc.png`,
          isNativeCurrency: true,
          name: 'bitcoin',
          symbol: 'BTC',
        },
      },
      optimism: {
        'optimism:DAI': { name: 'DAI', symbol: 'DAI' },
        'optimism:ETH': { iconUrl: null, name: 'ether', symbol: 'ETH' },
      },
    });

    expect(parsed.bitcoin?.['bitcoin:BTC']?.iconUrl).toBe('/api/icons/btc.png');
    expect(parsed.optimism?.['optimism:DAI']?.iconUrl).toBeUndefined();
    expect(parsed.optimism?.['optimism:ETH']?.iconUrl).toBeUndefined();
  });

  it('should rewrite the crypto payment icon', () => {
    const { result } = CryptoPaymentResponse.parse({
      result: {
        chainName: 'ethereum',
        cryptoAddress: '0x0000000000000000000000000000000000000001',
        cryptocurrency: 'ETH',
        durationInMonths: 1,
        finalPriceInCrypto: 0.01,
        finalPriceInEur: 30,
        firstPayment: true,
        hoursForPayment: 3,
        iconUrl: `${DATA}/main/assets/icons/eth.png`,
        months: 1,
        numberOfMonths: 1,
        startDate: null,
        subscriptionId: '1',
        transactionStarted: false,
        vat: 0,
      },
    });

    expect(result?.iconUrl).toBe('/api/icons/eth.png');
  });
});
