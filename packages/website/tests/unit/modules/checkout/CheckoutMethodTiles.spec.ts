import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { SigilEvents } from '@rotki/sigil';
import { set } from '@vueuse/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CheckoutMethodTiles from '~/modules/checkout/components/method/CheckoutMethodTiles.vue';

const { braintreePaymentEnabled, chronicle, discountCode, fetchBraintreePaymentAvailability, planId, referralCode, subscriptionId, upgradeSubId } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return {
    braintreePaymentEnabled: ref<boolean>(true),
    chronicle: vi.fn(),
    discountCode: ref<string>(),
    fetchBraintreePaymentAvailability: vi.fn(),
    planId: ref<number>(),
    referralCode: ref<string>(),
    subscriptionId: ref<string>(),
    upgradeSubId: ref<string>(),
  };
});

vi.mock('~/modules/checkout/composables/use-plan-params', () => ({
  useDiscountCodeParams: () => ({ discountCode }),
  usePlanIdParam: () => ({ planId }),
  useReferralCodeParam: () => ({ referralCode }),
  useSubscriptionIdParam: () => ({ subscriptionId, upgradeSubId }),
}));

vi.mock('~/store', () => ({
  useMainStore: () => ({ braintreePaymentEnabled, fetchBraintreePaymentAvailability }),
}));

vi.mock('~/composables/chronicling/use-sigil-events', () => ({
  useSigilEvents: () => ({ chronicle }),
}));

function hrefs(wrapper: VueWrapper): (string | undefined)[] {
  return wrapper.findAll('a').map(link => link.attributes('href'));
}

describe('checkoutMethodTiles', () => {
  beforeEach(() => {
    set(braintreePaymentEnabled, true);
    set(discountCode, undefined);
    set(planId, 3);
    set(referralCode, undefined);
    set(subscriptionId, undefined);
    set(upgradeSubId, undefined);
    chronicle.mockClear();
    fetchBraintreePaymentAvailability.mockClear();
  });

  it('links every method with the checkout params', async () => {
    set(referralCode, 'DGXXOU');
    set(discountCode, 'AUTUMN');

    const wrapper = await mountSuspended(CheckoutMethodTiles);

    const query = 'planId=3&ref=DGXXOU&discountCode=AUTUMN';
    expect(hrefs(wrapper)).toEqual([
      `/checkout/pay/card?${query}`,
      `/checkout/pay/paypal?${query}`,
      `/checkout/pay/request-crypto?${query}`,
    ]);
  });

  it('marks the current method', async () => {
    const wrapper = await mountSuspended(CheckoutMethodTiles, { props: { current: 'paypal' } });

    expect(wrapper.get('[aria-current="page"]').attributes('href')).toBe('/checkout/pay/paypal?planId=3');
  });

  it('turns card and PayPal off while Braintree is unavailable', async () => {
    set(braintreePaymentEnabled, false);

    const wrapper = await mountSuspended(CheckoutMethodTiles);

    expect(hrefs(wrapper)).toEqual(['/checkout/pay/request-crypto?planId=3']);
    expect(wrapper.get('[data-cy="method-card"]').attributes('aria-disabled')).toBe('true');
    expect(wrapper.get('[data-cy="method-paypal"]').attributes('aria-disabled')).toBe('true');
  });

  it('checks Braintree itself, since payment pages can be opened directly', async () => {
    await mountSuspended(CheckoutMethodTiles, { props: { current: 'crypto' } });

    expect(fetchBraintreePaymentAvailability).toHaveBeenCalledOnce();
  });

  it('offers only crypto for a renewal, keeping the subscription id', async () => {
    set(subscriptionId, 'sub-1');

    const wrapper = await mountSuspended(CheckoutMethodTiles);

    expect(hrefs(wrapper)).toEqual(['/checkout/pay/request-crypto?planId=3&id=sub-1']);
  });

  it('offers no switch on the renewal payment page itself', async () => {
    set(subscriptionId, 'sub-1');

    const wrapper = await mountSuspended(CheckoutMethodTiles, { props: { current: 'crypto' } });

    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('offers no switch during an upgrade', async () => {
    set(upgradeSubId, 'sub-9');

    const wrapper = await mountSuspended(CheckoutMethodTiles);

    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('tracks a switch to another method, not a click on the current one', async () => {
    const wrapper = await mountSuspended(CheckoutMethodTiles, { props: { current: 'paypal' } });
    const follow = (method: string): void => {
      const link = wrapper.get(`[data-cy="method-${method}"]`).element;
      // Keep the link from navigating the test page.
      link.addEventListener('click', event => event.preventDefault());
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    };

    follow('paypal');
    follow('crypto');

    expect(chronicle).toHaveBeenCalledTimes(1);
    expect(chronicle).toHaveBeenCalledWith(SigilEvents.CHECKOUT_METHOD_SELECTED, { method: 'crypto', planId: 3 });
  });
});
