import { parseUtmFromQuery, resolveTrackingSession, type TrackingSession, UTM_COOKIE_MAX_AGE_SECONDS, UTM_COOKIE_NAME } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';

export function useUtmTracking() {
  const utmCookie = useCookie<TrackingSession | undefined>(UTM_COOKIE_NAME, {
    maxAge: UTM_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
  });

  function captureUtmParams(): void {
    if (import.meta.server)
      return;

    const route = useRoute();
    const session = resolveTrackingSession(get(utmCookie), {
      utm: parseUtmFromQuery(route.query),
      referrer: typeof document === 'undefined' ? '' : document.referrer,
      landingPath: route.fullPath,
    });

    if (session)
      set(utmCookie, session);
  }

  function getTrackingData(): TrackingSession | undefined {
    return get(utmCookie);
  }

  return {
    captureUtmParams,
    getTrackingData,
    trackingSession: readonly(utmCookie),
  };
}
