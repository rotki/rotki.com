import { createTrackingSession, parseUtmFromQuery, type TrackingSession, UTM_COOKIE_MAX_AGE_SECONDS, UTM_COOKIE_NAME } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';

export function useUtmTracking() {
  const utmCookie = useCookie<TrackingSession | undefined>(UTM_COOKIE_NAME, {
    maxAge: UTM_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
  });

  function captureUtmParams(): void {
    if (import.meta.server)
      return;

    if (get(utmCookie))
      return;

    const route = useRoute();
    const utm = parseUtmFromQuery(route.query as Record<string, unknown>);
    const hasUtm = Object.values(utm).some(v => !!v);

    set(utmCookie, createTrackingSession({
      utm: hasUtm ? utm : undefined,
      referrer: document.referrer,
      landingPath: route.fullPath,
    }));
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
