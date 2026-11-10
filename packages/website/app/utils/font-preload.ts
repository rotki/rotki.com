import { readdirSync } from 'node:fs';

/** Inter's Latin subset: the face every page's text uses, emitted by Vite with a content hash. */
const FONT_FILE = /^inter-latin-opsz-normal\.[\w-]+\.woff2$/;

interface PublicAssetDir {
  dir: string;
  baseURL?: string;
}

const urlCache = new Map<string, string | undefined>();

function listFiles(dir: string): string[] {
  try {
    return readdirSync(dir);
  }
  catch {
    return [];
  }
}

/**
 * Finds the hashed font among Nitro's public asset folders. Prerendering runs before those folders
 * are copied into the output, so the files are read where the client build left them.
 */
function findFontUrl(assets: PublicAssetDir[]): string | undefined {
  const cacheKey = assets.map(asset => asset.dir).join('|');
  if (!urlCache.has(cacheKey)) {
    const url = assets.flatMap((asset) => {
      const file = listFiles(asset.dir).find(name => FONT_FILE.test(name));
      return file ? [`${(asset.baseURL ?? '/').replace(/\/?$/, '/')}${file}`] : [];
    })[0];
    urlCache.set(cacheKey, url);
  }
  return urlCache.get(cacheKey);
}

/**
 * Build-time helper: adds a preload for Inter to a generated HTML file, so the first paint uses the
 * web font instead of a fallback that swaps later and moves the text. Runs on every prerendered page
 * and on the `200.html` shell the client-only routes start from, which a `useHead` link cannot reach.
 * Leaves the page unchanged when the font cannot be found, so a renamed file never breaks the build.
 */
export function withFontPreload(html: string, assets: PublicAssetDir[]): string {
  const url = findFontUrl(assets);
  if (!url || html.includes(url))
    return html;
  const link = `<link rel="preload" as="font" type="font/woff2" href="${url}" crossorigin>`;
  return html.replace(/<head[^>]*>/, head => `${head}${link}`);
}
