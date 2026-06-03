import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { get } from '@vueuse/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useReferralCodeParam } from '~/modules/checkout/composables/use-plan-params';

// Controllable route query + persisted referral cookie. The mock factories only
// reference these refs when invoked (at test time), so closing over them is safe.
const query = ref<Record<string, unknown>>({});
const cookie = ref<string | undefined>(undefined);

mockNuxtImport('useRoute', () => () => ({ query: get(query) }));
mockNuxtImport('useCookie', () => () => cookie);

describe('useReferralCodeParam', () => {
  beforeEach(() => {
    query.value = {};
    cookie.value = undefined;
  });

  it('returns the ref from the query when present', () => {
    query.value = { ref: 'FROM_QUERY' };
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBe('FROM_QUERY');
  });

  it('falls back to the cookie when the query param was stripped', () => {
    cookie.value = 'FROM_COOKIE';
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBe('FROM_COOKIE');
  });

  it('prefers the query param over the cookie', () => {
    query.value = { ref: 'FROM_QUERY' };
    cookie.value = 'FROM_COOKIE';
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBe('FROM_QUERY');
  });

  it('returns undefined when neither query nor cookie has a code', () => {
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBeUndefined();
  });

  it('ignores an empty-string query param and falls back to the cookie', () => {
    query.value = { ref: '' };
    cookie.value = 'FROM_COOKIE';
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBe('FROM_COOKIE');
  });

  it('ignores an array-valued query param', () => {
    query.value = { ref: ['A', 'B'] };
    const { referralCode } = useReferralCodeParam();
    expect(get(referralCode)).toBeUndefined();
  });
});
