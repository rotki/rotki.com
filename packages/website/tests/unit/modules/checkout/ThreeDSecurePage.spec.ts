import type { ThreeDSecureParams, ThreeDSecureState } from '@rotki/card-payment-common/schemas/three-d-secure';
import type { ThreeDSecureFailure } from '~/modules/checkout/composables/use-three-d-secure';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { set } from '@vueuse/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThreeDSecurePage from '~/pages/checkout/pay/3d-secure.vue';

const fake = await vi.hoisted(async () => {
  const { computed, shallowRef } = await import('vue');
  const state = shallowRef<ThreeDSecureState>('initializing');
  return {
    state,
    error: shallowRef<string>(''),
    failure: shallowRef<ThreeDSecureFailure>(),
    challengeVisible: shallowRef<boolean>(false),
    serverError: shallowRef<boolean>(false),
    params: shallowRef<ThreeDSecureParams>(),
    isProcessing: computed<boolean>(() => ['initializing', 'verifying', 'challenge-active', 'finishing'].includes(state.value)),
    initializeProcess: vi.fn(async () => ({ success: false })),
    navigateTo: vi.fn(),
  };
});

mockNuxtImport('navigateTo', () => fake.navigateTo);

vi.mock('~/modules/checkout/composables/use-three-d-secure', () => ({
  useThreeDSecure: () => ({ ...fake, cleanup: vi.fn(), clearStoredData: vi.fn() }),
}));

const PARAMS: ThreeDSecureParams = {
  amount: '25.00',
  finalAmount: '22.50',
  renewingPrice: '25.00',
  bin: '411111',
  nonce: 'card-nonce',
  planId: 3,
  token: 'client-token',
  discountCode: 'SUMMER',
  durationInMonths: 1,
  planName: 'basic',
};

async function mountPage(): Promise<VueWrapper> {
  const wrapper = await mountSuspended(ThreeDSecurePage);
  await flushPromises();
  return wrapper;
}

describe('3D Secure page', () => {
  beforeEach(() => {
    set(fake.state, 'verifying');
    set(fake.error, '');
    set(fake.failure, undefined);
    set(fake.challengeVisible, false);
    set(fake.serverError, false);
    set(fake.params, PARAMS);
    fake.initializeProcess.mockResolvedValue({ success: false });
    fake.navigateTo.mockClear();
  });

  it('asks the buyer to confirm with their bank, next to what they are paying', async () => {
    const wrapper = await mountPage();

    expect(wrapper.get('h1').text()).toBe('Confirm with your bank');
    expect(wrapper.get('[data-testid="three-d-secure-status"]').text()).toBe('Connecting to your bank…');
    const summary = wrapper.get('[data-testid="three-d-secure-summary"]');
    expect(summary.get('[data-testid="three-d-secure-amount"]').text()).toBe('22.50 €');
    expect(summary.get('[data-testid="plan-name"]').text()).toBe('Basic, monthly');
    expect(summary.text()).toContain('Then 25.00 € per month from');
  });

  it('shows the amount due and the renewal on the folded summary bar, as the card page does', async () => {
    const toggle = (await mountPage()).get('[data-testid="summary-toggle"]');
    expect(toggle.text()).toContain('22.50 €');
    expect(toggle.text()).toContain('then 25.00 €/month');

    set(fake.params, { ...PARAMS, durationInMonths: 12, renewingPrice: '250.00' });
    expect((await mountPage()).get('[data-testid="summary-toggle"]').text()).toContain('then 250.00 €/year');
  });

  it('leaves the renewal date out for an upgrade', async () => {
    set(fake.params, { ...PARAMS, upgradeSubId: 'sub-1' });
    const wrapper = await mountPage();

    expect(wrapper.get('[data-testid="three-d-secure-summary"]').text()).toContain('Then 25.00 € per month until you cancel.');
  });

  it('asks the buyer to keep the page open while the payment finishes', async () => {
    set(fake.state, 'finishing');
    const wrapper = await mountPage();

    expect(wrapper.get('[data-testid="three-d-secure-status"]').text()).toBe('Finishing your payment. Keep this page open for a few seconds.');
  });

  it('offers the way back under the bank\'s challenge, not above it', async () => {
    set(fake.state, 'challenge-active');
    set(fake.challengeVisible, true);
    const wrapper = await mountPage();

    const challenge = wrapper.get('[data-testid="three-d-secure-challenge"]').element;
    const cancel = wrapper.get('a[href^="/checkout/pay/card"]').element;
    expect(challenge.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(wrapper.find('[data-testid="three-d-secure-status"]').exists()).toBe(false);
  });

  it('opens the success page once the payment went through', async () => {
    fake.initializeProcess.mockResolvedValue({ success: true });
    await mountPage();

    expect(fake.navigateTo).toHaveBeenCalledWith('/checkout/success');
  });

  it('says nothing was charged when the bank did not confirm, and offers to try again', async () => {
    set(fake.state, 'error');
    set(fake.failure, 'not-confirmed');
    set(fake.error, 'Authentication failed: authenticate failed');
    const wrapper = await mountPage();

    expect(wrapper.get('h1').text()).toBe('Your bank didn\'t confirm the payment');
    const failed = wrapper.get('[data-testid="three-d-secure-failed"]');
    expect(wrapper.get('[data-testid="payment-page-heading"]').text()).toContain('Nothing was charged');
    expect(failed.get('[role="alert"]').text()).toContain('the code was wrong');
    expect(failed.text()).not.toContain('authenticate failed');
    expect(failed.get('a[href^="/checkout/pay/card"]').attributes('href')).toBe('/checkout/pay/card?planId=3&discountCode=SUMMER');
  });

  it('shows the decline message when the payment failed, keeping the upgrade on retry', async () => {
    set(fake.state, 'error');
    set(fake.failure, 'payment');
    set(fake.error, 'Do Not Honor');
    set(fake.params, { ...PARAMS, discountCode: undefined, upgradeSubId: 'sub-1' });
    const wrapper = await mountPage();

    expect(wrapper.get('h1').text()).toBe('Your payment didn\'t go through');
    const failed = wrapper.get('[data-testid="three-d-secure-failed"]');
    expect(failed.get('[data-testid="three-d-secure-error"]').text()).toBe('Do Not Honor');
    expect(failed.get('a[href^="/checkout/pay/card"]').attributes('href')).toBe('/checkout/pay/card?planId=3&upgradeSubId=sub-1');
  });

  it('does not claim nothing was charged after a server error', async () => {
    set(fake.state, 'error');
    set(fake.failure, 'payment');
    set(fake.serverError, true);
    const wrapper = await mountPage();

    const heading = wrapper.get('[data-testid="payment-page-heading"]').text();
    expect(heading).toContain('We could not confirm whether the payment went through.');
    expect(heading).not.toContain('Nothing was charged');
  });

  it('explains a missing handoff and leads back to the plans', async () => {
    set(fake.state, 'error');
    set(fake.params, undefined);
    const wrapper = await mountPage();

    const expired = wrapper.get('[data-testid="three-d-secure-expired"]');
    expect(expired.get('h1').text()).toBe('This bank confirmation has ended');
    expect(expired.get('a').attributes('href')).toBe('/checkout/pay');
    expect(wrapper.find('[data-testid="payment-page"]').exists()).toBe(false);
  });
});
