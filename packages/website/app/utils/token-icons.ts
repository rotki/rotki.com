const DATA_REPO_URL = 'https://raw.githubusercontent.com/rotki/data/';

/**
 * Any ref (branch, refs/heads/<branch> or commit), since the Go server picks the branch.
 * The filename pattern matches rotkidata.IsIconFile in the Go server; keep the two in sync.
 */
const DATA_ICON_URL = /^https:\/\/raw\.githubusercontent\.com\/rotki\/data\/[^?#]+\/assets\/icons\/([\w.-]{1,64}\.(?:png|svg|webp|gif|jpe?g))$/i;

/**
 * Rewrites a rotki/data icon URL from the Python backend to the Go server's same-origin
 * copy, so the browser never fetches it from GitHub. A rotki/data URL the Go server cannot
 * serve becomes undefined, so the icon shows its placeholder instead of a blocked image
 * (the CSP no longer allows rotki/data). Other URLs are returned unchanged.
 */
export function localIconUrl(url: string | null | undefined): string | undefined {
  if (!url)
    return undefined;
  const file = DATA_ICON_URL.exec(url)?.[1];
  if (file)
    return `/api/icons/${file}`;
  return url.startsWith(DATA_REPO_URL) ? undefined : url;
}
