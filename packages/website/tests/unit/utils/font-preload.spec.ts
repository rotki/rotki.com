import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { withFontPreload } from '~/utils/font-preload';

const PAGE = '<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8"></head><body></body></html>';

/** A public asset folder the way the client build leaves it, with the files given. */
function assetDir(files: string[]): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'font-preload-'));
  mkdirSync(dir, { recursive: true });
  for (const file of files)
    writeFileSync(path.join(dir, file), '');
  return dir;
}

describe('font-preload', () => {
  it('preloads the hashed Inter file first thing in the head', () => {
    const dir = assetDir(['entry.abc.css', 'inter-latin-opsz-normal.BwkfbSeq.woff2', 'inter-cyrillic-opsz-normal.Xy.woff2']);

    expect(withFontPreload(PAGE, [{ dir, baseURL: '/_nuxt' }])).toBe(
      '<!DOCTYPE html><html lang="en-US"><head><link rel="preload" as="font" type="font/woff2" href="/_nuxt/inter-latin-opsz-normal.BwkfbSeq.woff2" crossorigin><meta charset="utf-8"></head><body></body></html>',
    );
  });

  it('adds the link only once', () => {
    const assets = [{ dir: assetDir(['inter-latin-opsz-normal.Ab12.woff2']), baseURL: '/_nuxt/' }];
    const once = withFontPreload(PAGE, assets);

    expect(withFontPreload(once, assets)).toBe(once);
  });

  it('leaves the page alone when the font or its folder is missing', () => {
    expect(withFontPreload(PAGE, [{ dir: assetDir(['entry.abc.css']) }])).toBe(PAGE);
    expect(withFontPreload(PAGE, [{ dir: path.join(tmpdir(), 'font-preload-does-not-exist') }])).toBe(PAGE);
  });
});
