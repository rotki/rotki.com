import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRotkiDataLogoResolver } from '../../../../modules/ui-library/runtime/logo-resolver';

const DATA_REPO = 'https://raw.githubusercontent.com/rotki/data';

function mappingsResponse(logo: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ logo }), { status: 200 });
}

describe('modules/ui-library/runtime/logo-resolver', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    sessionStorage.clear();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('resolves a logo name to its image on the branch', async () => {
    fetchMock.mockResolvedValue(mappingsResponse({ website: 'halloween.png' }));
    const resolve = createRotkiDataLogoResolver(async () => 'develop');

    await expect(resolve('website')).resolves.toBe(`${DATA_REPO}/develop/assets/icons/halloween.png`);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${DATA_REPO}/develop/constants/asset-mappings.json`);
  });

  it('fetches the mapping once for concurrent and later calls', async () => {
    fetchMock.mockResolvedValue(mappingsResponse({ app: 'app.png', website: 'web.png' }));
    const resolve = createRotkiDataLogoResolver(async () => 'main');

    await Promise.all([resolve('website'), resolve('app')]);
    await resolve('website');

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reuses the mapping a previous page load stored in sessionStorage', async () => {
    fetchMock.mockResolvedValue(mappingsResponse({ website: 'web.png' }));
    await createRotkiDataLogoResolver(async () => 'main')('website');

    const reloaded = createRotkiDataLogoResolver(async () => 'main');
    await expect(reloaded('website')).resolves.toBe(`${DATA_REPO}/main/assets/icons/web.png`);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps each branch separate', async () => {
    fetchMock.mockImplementation(async input =>
      mappingsResponse({ website: String(input).includes('/develop/') ? 'develop.png' : 'main.png' }));
    let branch = 'main';
    const resolve = createRotkiDataLogoResolver(async () => branch);

    await expect(resolve('website')).resolves.toContain('/main/assets/icons/main.png');
    branch = 'develop';
    await expect(resolve('website')).resolves.toContain('/develop/assets/icons/develop.png');
  });

  it('returns nothing for a name the mapping does not have', async () => {
    fetchMock.mockResolvedValue(mappingsResponse({ app: 'app.png' }));

    await expect(createRotkiDataLogoResolver(async () => 'main')('website')).resolves.toBeUndefined();
  });

  it.each([
    ['a path out of the icons folder', '../../../other/repo/main/logo.png'],
    ['a nested path', 'seasonal/logo.png'],
    ['an absolute URL', 'https://example.com/logo.png'],
    ['a non-image file', 'logo.html'],
  ])('rejects %s', async (_name, file) => {
    fetchMock.mockResolvedValue(mappingsResponse({ website: file }));

    await expect(createRotkiDataLogoResolver(async () => 'main')('website')).resolves.toBeUndefined();
  });

  it('returns nothing when GitHub cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(createRotkiDataLogoResolver(async () => 'main')('website')).resolves.toBeUndefined();
  });

  it('returns nothing for an error response or an unexpected body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    await expect(createRotkiDataLogoResolver(async () => 'main')('website')).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ logo: { website: 42 } }), { status: 200 }));
    await expect(createRotkiDataLogoResolver(async () => 'develop')('website')).resolves.toBeUndefined();
  });
});
