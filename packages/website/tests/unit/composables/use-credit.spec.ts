import type { CreditBalance } from '~/types/account';
import { get } from '@vueuse/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithCsrf = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
  useAuthHintCookie: () => ({ value: undefined }),
  useSessionIdCookie: () => ({ value: undefined }),
}));

const validCreditBalance: CreditBalance = {
  balanceEur: '25.50',
  history: [
    {
      amountEur: '25.50',
      balanceAfterEur: '25.50',
      createdAt: '2026-04-01T10:00:00Z',
      entryType: 'referral',
      notes: 'Referral bonus',
    },
  ],
};

const emptyCreditBalance: CreditBalance = {
  balanceEur: '0',
  history: [],
};

describe('useCredit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct initial state', async () => {
    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, hasHistory, history, loading } = useCredit();

    expect(get(balance)).toBe('0');
    expect(get(hasHistory)).toBe(false);
    expect(get(history)).toEqual([]);
    expect(get(loading)).toBe(false);
  });

  it('should load credit balance successfully', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(validCreditBalance);

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, hasHistory, history, load, loading } = useCredit();

    const loadPromise = load();
    expect(get(loading)).toBe(true);

    await loadPromise;

    expect(get(loading)).toBe(false);
    expect(get(balance)).toBe('25.50');
    expect(get(hasHistory)).toBe(true);
    expect(get(history)).toHaveLength(1);
    expect(mockFetchWithCsrf).toHaveBeenCalledWith(
      '/webapi/2/credit/',
      { method: 'GET' },
    );
  });

  it('should handle empty history', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(emptyCreditBalance);

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, hasHistory, history, load } = useCredit();

    await load();

    expect(get(balance)).toBe('0');
    expect(get(hasHistory)).toBe(false);
    expect(get(history)).toEqual([]);
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetchWithCsrf.mockRejectedValueOnce(new Error('Network error'));

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, history, loading, load } = useCredit();

    await load();

    expect(get(loading)).toBe(false);
    expect(get(balance)).toBe('0');
    expect(get(history)).toEqual([]);
  });

  it('should handle invalid response data', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({ invalid: 'data' });

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, history, load } = useCredit();

    await load();

    expect(get(balance)).toBe('0');
    expect(get(history)).toEqual([]);
  });

  it('should not overwrite data when load fails', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce(validCreditBalance)
      .mockRejectedValueOnce(new Error('Network error'));

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, history, load } = useCredit();

    await load();
    expect(get(balance)).toBe('25.50');
    expect(get(history)).toHaveLength(1);

    await load();
    expect(get(balance)).toBe('25.50');
    expect(get(history)).toHaveLength(1);
  });

  it('should update data on subsequent successful loads', async () => {
    const updatedBalance: CreditBalance = {
      balanceEur: '50.00',
      history: [
        {
          amountEur: '25.50',
          balanceAfterEur: '25.50',
          createdAt: '2026-04-01T10:00:00Z',
          entryType: 'referral',
          notes: 'Referral bonus',
        },
        {
          amountEur: '24.50',
          balanceAfterEur: '50.00',
          createdAt: '2026-04-05T10:00:00Z',
          entryType: 'referral',
          notes: 'Second referral',
        },
      ],
    };

    mockFetchWithCsrf
      .mockResolvedValueOnce(validCreditBalance)
      .mockResolvedValueOnce(updatedBalance);

    const { useCredit } = await import('~/composables/account/use-credit');
    const { balance, history, load } = useCredit();

    await load();
    expect(get(balance)).toBe('25.50');
    expect(get(history)).toHaveLength(1);

    await load();
    expect(get(balance)).toBe('50.00');
    expect(get(history)).toHaveLength(2);
  });
});
