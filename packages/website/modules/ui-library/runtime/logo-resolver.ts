import type { LogoResolver } from '@rotki/ui-library';

/** Logo names the Go server serves at `/api/logo/<name>`. */
const SERVED_LOGOS: ReadonlySet<string> = new Set(['website']);

/**
 * Resolves `RuiLogo` names to the seasonal logos rotki publishes in rotki/data.
 * The Go server picks the rotki/data branch, caches the mapping and serves the
 * image from this origin, so the browser never asks GitHub. When the endpoint
 * fails, `RuiLogo` keeps its bundled logo.
 *
 * The URL is absolute: `RuiLogo` skips a duplicate image preload by comparing
 * it with `link.href`, which the browser always makes absolute. The resolver
 * only runs after mount, so `window` is available.
 */
export function createSeasonalLogoResolver(): LogoResolver {
  return async (name: string): Promise<string | undefined> =>
    SERVED_LOGOS.has(name) ? new URL(`/api/logo/${name}`, window.location.origin).href : undefined;
}
