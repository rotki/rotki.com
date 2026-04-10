// Sigil track helper, UTM attribution contract, and pure tracking helpers.
// Sigil is the only place that talks to `window.umami` directly — everything
// else goes through `sigilTrack`.

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

let debugMode = false;

/**
 * Enable or disable debug mode for Sigil events.
 * When enabled, every tracked event is logged to the console with its
 * full payload, making it easy to verify the data shape during development.
 */
export function setSigilDebug(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * Fire a Sigil event. Framework-agnostic and side-effect-safe:
 *   - No-op on the server (guarded by `typeof window`).
 *   - Swallows any error from the tracker so it can never break host UX.
 *   - Strips `undefined` fields so the event payload is clean.
 *   - When debug mode is enabled, logs the event to the console.
 *
 * Host packages that need extra context (UTM attribution, session id, etc.)
 * should enrich `data` via `buildTrackedEventData` before passing it in.
 */
export function sigilTrack(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined')
    return;

  try {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    if (debugMode) {
      // eslint-disable-next-line no-console -- intentional debug output
      console.log(`[sigil] ${event}`, cleanData);
    }

    window.umami?.track(event, cleanData);
  }
  catch {
    // Never let tracking affect host UX
  }
}

// UTM attribution contract — types and cookie constants for the first-touch
// attribution session that every Sigil event is tagged with. Shared so any
// future client (e.g. the card-payment SPA) that wants session continuity can
// read the same cookie using the same shape.

export const UTM_COOKIE_NAME = '_utm';

export const UTM_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
  capturedAt?: string;
}

export interface TrackingSession {
  sessionId: string;
  utm: UtmParams;
}

/**
 * Normalize a single query parameter value to a string or undefined.
 * Accepts whatever a router might hand us (string, null, string[], undefined)
 * and returns the first usable string.
 */
export function parseQueryParam(value: unknown): string | undefined {
  if (value == null)
    return undefined;

  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

/**
 * Extract the standard `utm_*` fields from a query record. Unknown keys are
 * ignored. Missing fields are left `undefined` so the caller can spread
 * cleanly into a `UtmParams` object.
 */
export function parseUtmFromQuery(
  query: Record<string, unknown>,
): Pick<UtmParams, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'> {
  return {
    utmSource: parseQueryParam(query.utm_source),
    utmMedium: parseQueryParam(query.utm_medium),
    utmCampaign: parseQueryParam(query.utm_campaign),
    utmContent: parseQueryParam(query.utm_content),
    utmTerm: parseQueryParam(query.utm_term),
  };
}

interface CreateTrackingSessionInput {
  utm?: Pick<UtmParams, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>;
  referrer?: string;
  landingPath: string;
}

/**
 * Build a fresh first-touch tracking session. Callers provide the already-
 * parsed UTM fields (if any), the referrer, and the landing path; sigil adds
 * a fresh session id and capture timestamp. Callers decide whether to store
 * the result.
 */
export function createTrackingSession(input: CreateTrackingSessionInput): TrackingSession {
  return {
    sessionId: crypto.randomUUID(),
    utm: {
      ...input.utm,
      referrer: input.referrer || undefined,
      landingPath: input.landingPath,
      capturedAt: new Date().toISOString(),
    },
  };
}

/**
 * Tag an event data object with session attribution fields. This is the
 * canonical shape every Sigil event should carry when a tracking session is
 * available. Returns a fresh object; the input is not mutated.
 */
export function buildTrackedEventData(
  data: object,
  session: TrackingSession | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  Object.assign(result, data);
  result.session_id = session?.sessionId;
  result.utm_source = session?.utm?.utmSource;
  result.utm_medium = session?.utm?.utmMedium;
  result.utm_campaign = session?.utm?.utmCampaign;
  result.utm_content = session?.utm?.utmContent;
  result.utm_term = session?.utm?.utmTerm;
  result.referrer = session?.utm?.referrer;
  result.landing_path = session?.utm?.landingPath;
  return result;
}
