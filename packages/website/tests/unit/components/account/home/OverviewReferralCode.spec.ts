import type { VueWrapper } from '@vue/test-utils';
import type { ReferralCodeResponse } from '~/types';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OverviewReferralCode from '~/components/account/home/OverviewReferralCode.vue';

const mockFetchWithCsrf = vi.hoisted(() => vi.fn());

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
  useAuthHintCookie: () => ({ value: undefined }),
  useSessionIdCookie: () => ({ value: undefined }),
}));

const withCode: ReferralCodeResponse = {
  code: 'FRIEND10',
  discount: { amount: '10', discountType: DiscountType.PERCENTAGE, usesLeft: 50, validUntil: '2027-01-01T00:00:00Z' },
  hasReferral: true,
};

const withoutCode: ReferralCodeResponse = { hasReferral: false };

async function mountWith(...responses: ReferralCodeResponse[]): Promise<VueWrapper> {
  for (const response of responses)
    mockFetchWithCsrf.mockResolvedValueOnce(response);

  const wrapper = await mountSuspended(OverviewReferralCode);
  await vi.waitFor(() => {
    expect(wrapper.find('[data-testid="overview-referral-code"]').exists() || findCreateButton(wrapper) !== undefined).toBe(true);
  });
  return wrapper;
}

function findCreateButton(wrapper: VueWrapper) {
  return wrapper.findAll('button').find(button => button.text() === 'Create referral code');
}

describe('overview referral code', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the code with a copy button that keyboard users can reach', async () => {
    const wrapper = await mountWith(withCode);

    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/webapi/2/referral', { method: 'GET' });
    expect(wrapper.get('[data-testid="overview-referral-code"]').text()).toBe('FRIEND10');
    const copy = wrapper.get('button[aria-label="Copy to clipboard"]');
    expect(copy.attributes('tabindex')).toBeUndefined();
    expect(findCreateButton(wrapper)).toBeUndefined();
  });

  it('creates a code in place when the account has none', async () => {
    const wrapper = await mountWith(withoutCode, withCode);

    expect(wrapper.find('[data-testid="overview-referral-code"]').exists()).toBe(false);
    await findCreateButton(wrapper)!.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="overview-referral-code"]').exists()).toBe(true);
    });
    expect(mockFetchWithCsrf).toHaveBeenLastCalledWith('/webapi/2/referral', { method: 'POST' });
    expect(wrapper.get('[data-testid="overview-referral-code"]').text()).toBe('FRIEND10');
    expect(findCreateButton(wrapper)).toBeUndefined();
  });

  it('moves focus to the copy button after creating a code', async () => {
    const wrapper = await mountWith(withoutCode, withCode);
    document.body.append(wrapper.element);

    await findCreateButton(wrapper)!.trigger('click');

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(wrapper.get('button[aria-label="Copy to clipboard"]').element);
    });
    wrapper.element.remove();
  });

  it('keeps offering to create a code when the lookup fails', async () => {
    mockFetchWithCsrf.mockRejectedValueOnce(new Error('offline'));

    const wrapper = await mountSuspended(OverviewReferralCode);

    await vi.waitFor(() => {
      expect(findCreateButton(wrapper)).toBeDefined();
    });
  });
});
