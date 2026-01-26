import type { LocationQueryValue } from 'vue-router';
import type { TrackingSession, UtmParams } from '~/types/utm';
import { get, set } from '@vueuse/shared';

const UTM_COOKIE_NAME = '_utm';
const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Safely parses a query parameter value to a string or undefined.
 * Handles string, string[], null, and undefined cases.
 */
function parseQueryParam(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  if (value === null || value === undefined)
    return undefined;

  if (Array.isArray(value))
    return value[0] ?? undefined;

  return value;
}

export function useUtmTracking() {
  const utmCookie = useCookie<TrackingSession | undefined>(UTM_COOKIE_NAME, {
    maxAge: UTM_COOKIE_MAX_AGE,
    sameSite: 'lax',
  });

  function captureUtmParams(): void {
    if (import.meta.server)
      return;

    const route = useRoute();

    const utmFromUrl: UtmParams = {
      utmSource: parseQueryParam(route.query.utm_source),
      utmMedium: parseQueryParam(route.query.utm_medium),
      utmCampaign: parseQueryParam(route.query.utm_campaign),
      utmContent: parseQueryParam(route.query.utm_content),
      utmTerm: parseQueryParam(route.query.utm_term),
    };

    const hasUtm = Object.values(utmFromUrl).some(v => !!v);

    // First-touch: only capture if no existing UTM data
    if (hasUtm && !get(utmCookie)) {
      set(utmCookie, {
        sessionId: crypto.randomUUID(),
        utm: {
          ...utmFromUrl,
          referrer: document.referrer || undefined,
          landingPath: route.fullPath,
          capturedAt: new Date().toISOString(),
        },
      });
    }
    // If no UTMs but no session yet, create session without UTM data
    else if (!get(utmCookie)) {
      set(utmCookie, {
        sessionId: crypto.randomUUID(),
        utm: {
          referrer: document.referrer || undefined,
          landingPath: route.fullPath,
          capturedAt: new Date().toISOString(),
        },
      });
    }
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
