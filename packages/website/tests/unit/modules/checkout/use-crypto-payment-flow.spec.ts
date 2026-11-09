import { err, ok } from 'plainfp/result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCryptoPaymentFlow } from '~/modules/checkout/composables/use-crypto-payment-flow';
import { rejected } from '~/modules/checkout/utils/payment-failure';

const api = vi.hoisted(() => ({
  cryptoPayment: vi.fn(),
  switchCryptoPlan: vi.fn(),
  switchCryptoUpgradePlan: vi.fn(),
  upgradeCryptoSubscription: vi.fn(),
}));

const requestRefresh = vi.hoisted(() => vi.fn());

vi.mock('~/modules/checkout/composables/use-crypto-payment-api', () => ({
  useCryptoPaymentApi: () => api,
}));

vi.mock('~/composables/use-app-events', () => ({
  useAccountRefresh: () => ({ requestRefresh }),
}));

vi.mock('~/modules/checkout/composables/use-pending-subscription-id', () => ({
  usePendingSubscriptionId: () => ({ clearPendingSubscriptionId: vi.fn() }),
}));

const payment = { cryptoAddress: '0xabc', transactionStarted: false };

const params = { planId: 3, currency: 'eth:ETH', discountCode: '', subscriptionId: 'sub-1' };

const expectedBody = { planId: 3, cryptocurrencyIdentifier: 'eth:ETH', discountCode: undefined };

describe('useCryptoPaymentFlow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe.each([
    {
      action: 'createPayment',
      regular: api.cryptoPayment,
      upgrade: api.upgradeCryptoSubscription,
    },
    {
      action: 'switchPlan',
      regular: api.switchCryptoPlan,
      upgrade: api.switchCryptoUpgradePlan,
    },
  ] as const)('$action, for both', ({ action, regular, upgrade }) => {
    it('asks the regular endpoint and keeps the payment', async () => {
      regular.mockResolvedValue(ok(payment));
      const flow = useCryptoPaymentFlow();

      await expect(flow[action](params)).resolves.toEqual({ success: true, data: payment });

      expect(regular).toHaveBeenCalledWith({ ...expectedBody, subscriptionId: 'sub-1' });
      expect(upgrade).not.toHaveBeenCalled();
      expect(flow.paymentData.value).toEqual(payment);
      expect(flow.loading.value).toBe(false);
    });

    it('asks the upgrade endpoint with the subscription being upgraded', async () => {
      upgrade.mockResolvedValue(ok(payment));
      const flow = useCryptoPaymentFlow();

      await flow[action]({ ...params, upgradeSubId: 'upgrade-1' });

      expect(upgrade).toHaveBeenCalledWith({ ...expectedBody, subscriptionId: 'upgrade-1' });
      expect(regular).not.toHaveBeenCalled();
    });

    it('passes a discount code on', async () => {
      regular.mockResolvedValue(ok(payment));

      await useCryptoPaymentFlow()[action]({ ...params, discountCode: 'SUMMER' });

      expect(regular).toHaveBeenCalledWith(expect.objectContaining({ discountCode: 'SUMMER' }));
    });

    it('reports a refusal with its message and keeps no payment', async () => {
      regular.mockResolvedValue(err(rejected('Plan not available')));
      const flow = useCryptoPaymentFlow();

      await expect(flow[action](params)).resolves.toMatchObject({ success: false, error: 'Plan not available' });

      expect(flow.paymentData.value).toBeUndefined();
      expect(flow.loading.value).toBe(false);
    });

    it('reports a call that throws, without an account refresh', async () => {
      regular.mockRejectedValue(new Error('boom'));
      const flow = useCryptoPaymentFlow();

      await expect(flow[action](params)).resolves.toEqual({ success: false, error: 'boom' });

      expect(requestRefresh).not.toHaveBeenCalled();
      expect(flow.loading.value).toBe(false);
    });

    it('is loading until the backend answers', async () => {
      const { promise, resolve } = Promise.withResolvers<unknown>();
      regular.mockReturnValue(promise);
      const flow = useCryptoPaymentFlow();

      const running = flow[action](params);
      expect(flow.loading.value).toBe(true);

      resolve(ok(payment));
      await running;
      expect(flow.loading.value).toBe(false);
    });
  });

  describe('createPayment', () => {
    it.each([
      ['a payment', ok(payment)],
      ['a refusal', err(rejected('Plan not available'))],
    ])('refreshes the account after %s', async (_, answer) => {
      api.cryptoPayment.mockResolvedValue(answer);

      await useCryptoPaymentFlow().createPayment(params);

      expect(requestRefresh).toHaveBeenCalledOnce();
    });

    it('flags an account that has to verify its e-mail address', async () => {
      api.cryptoPayment.mockResolvedValue(err({ _tag: 'Unverified' }));

      await expect(useCryptoPaymentFlow().createPayment(params)).resolves.toMatchObject({ success: false, isUnverified: true });
    });

    it('treats a transaction that already started as done, keeping no payment', async () => {
      api.cryptoPayment.mockResolvedValue(ok({ ...payment, transactionStarted: true }));
      const flow = useCryptoPaymentFlow();

      await expect(flow.createPayment(params)).resolves.toEqual({ success: true, alreadyStarted: true });

      expect(flow.paymentData.value).toBeUndefined();
    });
  });

  describe('switchPlan', () => {
    it('does not refresh the account', async () => {
      api.switchCryptoPlan.mockResolvedValue(ok(payment));

      await useCryptoPaymentFlow().switchPlan(params);

      expect(requestRefresh).not.toHaveBeenCalled();
    });

    it('keeps a payment whose transaction already started', async () => {
      const started = { ...payment, transactionStarted: true };
      api.switchCryptoPlan.mockResolvedValue(ok(started));
      const flow = useCryptoPaymentFlow();

      await expect(flow.switchPlan(params)).resolves.toEqual({ success: true, data: started });

      expect(flow.paymentData.value).toEqual(started);
    });
  });
});
