import { get } from '@vueuse/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePaymentTokens } from '~/modules/web3/sponsorship/use-payment-tokens';

const { fetchWithCsrf } = vi.hoisted(() => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({ fetchWithCsrf }),
}));

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({ error: vi.fn(), info: vi.fn() }),
}));

const DEVELOP = 'https://raw.githubusercontent.com/rotki/data/refs/heads/develop/assets/icons';
const PRICES = { bronze: '1', gold: '3', silver: '2' };

describe('usePaymentTokens', () => {
  beforeEach(() => {
    fetchWithCsrf.mockReset();
  });

  it('should serve token icons from the go server, native token first', async () => {
    fetchWithCsrf.mockResolvedValue([
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, icon: `${DEVELOP}/dai.png`, iconUrl: `${DEVELOP}/dai.png`, prices: PRICES, symbol: 'DAI' },
      { address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: null, iconUrl: null, prices: PRICES, symbol: 'ETH' },
    ]);

    const { fetchPaymentTokens, paymentTokens } = usePaymentTokens();
    await fetchPaymentTokens();

    expect(get(paymentTokens).map(token => [token.symbol, token.icon, token.iconUrl])).toEqual([
      ['ETH', undefined, undefined],
      ['DAI', '/api/icons/dai.png', '/api/icons/dai.png'],
    ]);
  });
});
