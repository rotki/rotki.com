import { get, set } from '@vueuse/shared';

const REFERRAL_COOKIE_NAME = 'referral_code';
const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Referral codes arrive as a `?ref=` query param on inbound links, but the param is
// dropped by any in-app navigation that doesn't carry it forward (top nav, logo,
// footer, the valid-plan-id redirect). Persisting it in a cookie keeps the attribution
// sticky across lateral navigation and reloads until a purchase consumes it. Mirrors
// the UTM capture pattern in `useUtmTracking`.
export function useReferralTracking() {
  const referralCookie = useCookie<string | undefined>(REFERRAL_COOKIE_NAME, {
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    path: '/',
  });

  // Capture the inbound `?ref=` from the landing route. Called once on app start
  // (client-side) alongside UTM capture; last inbound code wins.
  function captureReferralCode(): void {
    if (import.meta.server)
      return;

    const { ref } = useRoute().query;
    if (typeof ref === 'string' && ref && get(referralCookie) !== ref)
      set(referralCookie, ref);
  }

  // Consume the attribution after a successful purchase so it isn't re-applied to
  // the user's future purchases.
  function clearReferralCode(): void {
    set(referralCookie, undefined);
  }

  return {
    captureReferralCode,
    clearReferralCode,
    referralCode: readonly(referralCookie),
  };
}
