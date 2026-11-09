/* Sigil track helper, UTM attribution contract, and pure tracking helpers.
   Sigil is the only place that talks to `window.umami` directly; everything
   else goes through `sigilTrack`. */
import { z } from 'zod';

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

/* UTM attribution contract: types and cookie constants for the attribution
   session that every Sigil event is tagged with. The first non-empty
   `utm_source` within the 30-day window wins. The website writes the cookie and
   the card-payment SPA only reads it. */

export const UTM_COOKIE_NAME = '_utm';

export const UTM_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const UtmParamsSchema = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  referrer: z.string().optional(),
  landingPath: z.string().optional(),
  capturedAt: z.string().optional(),
});

const TrackingSessionSchema = z.object({
  sessionId: z.string(),
  utm: UtmParamsSchema,
});

export type UtmParams = z.infer<typeof UtmParamsSchema>;

export type TrackingSession = z.infer<typeof TrackingSessionSchema>;

/** The raw value of the cookie called `name` in a `document.cookie` string. */
export function readCookie(cookies: string, name: string): string | undefined {
  const prefix = `${name}=`;
  return cookies.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith(prefix))?.slice(prefix.length);
}

/**
 * Read the tracking session out of a `document.cookie` string, for clients that
 * can't use Nuxt's `useCookie`. A missing or malformed cookie gives `undefined`.
 */
export function parseTrackingSessionCookie(cookies: string): TrackingSession | undefined {
  const value = readCookie(cookies, UTM_COOKIE_NAME);
  if (!value)
    return undefined;

  try {
    const parsed = TrackingSessionSchema.safeParse(JSON.parse(decodeURIComponent(value)));
    return parsed.success ? parsed.data : undefined;
  }
  catch {
    return undefined;
  }
}

/**
 * Normalize a single query parameter value to a string or undefined.
 * Accepts whatever a router might hand us (string, null, string[], undefined)
 * and returns the first usable string, trimmed.
 */
export function parseQueryParam(value: unknown): string | undefined {
  const first: unknown = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first.trim() : undefined;
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

/**
 * Generate a v4 UUID for use as an analytics session id, safe to call outside
 * secure contexts.
 *
 * `crypto.randomUUID()` is only defined in secure contexts (HTTPS or
 * `localhost`/`127.0.0.1`). When the app is reached over a plain-http,
 * non-localhost origin (a LAN IP, container host name, `0.0.0.0`, a tunnel,
 * etc.) the method is `undefined` and calling it throws, which would abort
 * app initialization. `crypto.getRandomValues` carries no such restriction
 * (it is available in insecure contexts too), so we use it to build a v4 UUID
 * by hand when `randomUUID` is missing.
 */
export function randomSessionId(): string {
  if (crypto.randomUUID)
    return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // Per RFC 4122 §4.4: set version (4) and variant (10xx) bits.
  bytes[6] = ((bytes[6] ?? 0) & 0x0F) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3F) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

interface CreateTrackingSessionInput {
  utm?: Pick<UtmParams, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>;
  referrer?: string;
  landingPath: string;
}

/* Routes whose remaining path segments are one-time credentials from an e-mail. */
const TOKEN_PATH_PREFIXES = ['/activate', '/password/reset'];

/**
 * A landing path that is safe to send to analytics. Only `utm_*` query parameters
 * survive, since others can carry OAuth codes, and token routes lose their token.
 */
export function sanitizeLandingPath(fullPath: string): string {
  const [pathAndQuery = ''] = fullPath.split('#');
  const queryStart = pathAndQuery.indexOf('?');
  const path = queryStart === -1 ? pathAndQuery : pathAndQuery.slice(0, queryStart);
  const query = queryStart === -1 ? '' : pathAndQuery.slice(queryStart + 1);

  const safePath = TOKEN_PATH_PREFIXES.find(prefix => path.startsWith(`${prefix}/`)) ?? path;
  const tags = query.split('&').filter(param => param.startsWith('utm_')).join('&');
  return tags ? `${safePath}?${tags}` : safePath;
}

/**
 * Build a fresh first-touch tracking session. Callers provide the already-
 * parsed UTM fields (if any), the referrer, and the landing path; sigil adds
 * a fresh session id and capture timestamp. Callers decide whether to store
 * the result.
 */
export function createTrackingSession(input: CreateTrackingSessionInput): TrackingSession {
  return {
    sessionId: randomSessionId(),
    utm: {
      ...input.utm,
      referrer: input.referrer === '' ? undefined : input.referrer,
      landingPath: sanitizeLandingPath(input.landingPath),
      capturedAt: new Date().toISOString(),
    },
  };
}

/**
 * The session to store after a page load, or `undefined` to keep the stored one.
 * A stored source is never replaced. A visit with a source fills in a session that
 * has none and keeps its id, so earlier events still link to the same visitor.
 * Fields without a `utm_source` are not recorded.
 */
export function resolveTrackingSession(
  existing: TrackingSession | undefined,
  input: CreateTrackingSessionInput,
): TrackingSession | undefined {
  if (existing?.utm?.utmSource)
    return undefined;

  const hasSource = !!input.utm?.utmSource;
  if (existing && !hasSource)
    return undefined;

  const session = createTrackingSession({ ...input, utm: hasSource ? input.utm : undefined });
  return existing?.sessionId ? { ...session, sessionId: existing.sessionId } : session;
}

/**
 * The snake_case attribution fields for a session. Every key is always present,
 * set to `undefined` when there is no session, so they overwrite any same-named
 * field in the event data. `utm` is read defensively because the session comes
 * from a cookie and may be malformed. Cookies written before the current rules can
 * hold tags without a source or an unsanitized path, so both are handled here too.
 */
function sessionAttributionFields(session: TrackingSession | undefined): Record<string, unknown> {
  const utm: UtmParams = session?.utm ?? {};
  const tags: UtmParams = utm.utmSource ? utm : {};
  return {
    session_id: session?.sessionId,
    utm_source: tags.utmSource,
    utm_medium: tags.utmMedium,
    utm_campaign: tags.utmCampaign,
    utm_content: tags.utmContent,
    utm_term: tags.utmTerm,
    referrer: utm.referrer,
    landing_path: typeof utm.landingPath === 'string' ? sanitizeLandingPath(utm.landingPath) : undefined,
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
  Object.assign(result, data, sessionAttributionFields(session));
  return result;
}
