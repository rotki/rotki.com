import type { H3Event } from 'h3';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Set up globals BEFORE any imports of the handler module
const mockCache = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

const mockFetchRaw = vi.fn();

// Mock globals before module import
vi.stubGlobal('defineEventHandler', (handler: (event: H3Event) => Promise<unknown>) => handler);
vi.stubGlobal('setResponseHeaders', vi.fn());
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const error = new Error(opts.statusMessage);
  (error as Error & { statusCode: number }).statusCode = opts.statusCode;
  return error;
});
vi.stubGlobal('$fetch', Object.assign(vi.fn(), { raw: mockFetchRaw }));

// Mock the cache service module
vi.mock('~~/server/utils/cache-service', () => ({
  getCacheService: () => mockCache,
}));

// Types for testing
interface GithubApiRelease {
  readonly tag_name: string;
  readonly assets: {
    readonly name: string;
    readonly browser_download_url: string;
  }[];
}

// Simulates a full GitHub API response with extra fields
function createMockGithubResponse(tagName: string, assets: { name: string; url: string }[]): GithubApiRelease & Record<string, unknown> {
  return {
    tag_name: tagName,
    assets: assets.map(asset => ({
      name: asset.name,
      browser_download_url: asset.url,
      id: Math.floor(Math.random() * 1000000),
      size: 100000000,
      download_count: 5000,
    })),
    id: 123456789,
    body: 'Release notes...',
    author: { login: 'rotki' },
  };
}

function createMockEvent(): H3Event {
  return {
    node: { req: {}, res: {} },
    context: {},
  } as unknown as H3Event;
}

describe('releases API handler', () => {
  let handler: (event: H3Event) => Promise<any>;
  let minimizePayload: (release: GithubApiRelease) => { tag_name: string; assets: { name: string; browser_download_url: string }[] };
  let isDownloadableApp: (name: string) => boolean;

  beforeAll(async () => {
    // Dynamic import AFTER mocks are set up
    const module = await import('~~/server/api/releases/latest.get');
    handler = module.default;
    minimizePayload = module.minimizePayload;
    isDownloadableApp = module.isDownloadableApp;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.getItem.mockReset();
    mockCache.setItem.mockReset();
    mockFetchRaw.mockReset();
  });

  describe('isDownloadableApp', () => {
    it('identifies Windows app correctly', () => {
      expect(isDownloadableApp('rotki-win32_v1.35.0.exe')).toBe(true);
      expect(isDownloadableApp('rotki-win32.exe')).toBe(true);
    });

    it('rejects invalid Windows app names', () => {
      expect(isDownloadableApp('rotki-darwin.exe')).toBe(false);
      expect(isDownloadableApp('win32.exe')).toBe(false);
      expect(isDownloadableApp('rotki-win32.msi')).toBe(false);
    });

    it('identifies Linux app correctly', () => {
      expect(isDownloadableApp('rotki-linux_x86_64-v1.35.0.AppImage')).toBe(true);
      expect(isDownloadableApp('rotki.AppImage')).toBe(true);
    });

    it('rejects invalid Linux app names', () => {
      expect(isDownloadableApp('rotki-linux.deb')).toBe(false);
      expect(isDownloadableApp('rotki-linux.tar.gz')).toBe(false);
    });

    it('identifies macOS x64 app correctly', () => {
      expect(isDownloadableApp('rotki-darwin-x64-v1.35.0.dmg')).toBe(true);
      expect(isDownloadableApp('rotki-darwin_x64.dmg')).toBe(true);
    });

    it('identifies macOS arm64 app correctly', () => {
      expect(isDownloadableApp('rotki-darwin-arm64-v1.35.0.dmg')).toBe(true);
      expect(isDownloadableApp('rotki-darwin_arm64.dmg')).toBe(true);
    });

    it('rejects invalid macOS app names', () => {
      expect(isDownloadableApp('rotki-darwin.dmg')).toBe(false);
      expect(isDownloadableApp('rotki-darwin-x64.pkg')).toBe(false);
      expect(isDownloadableApp('rotki-darwin-universal.dmg')).toBe(false);
    });

    it('rejects non-app files', () => {
      expect(isDownloadableApp('CHANGELOG.md')).toBe(false);
      expect(isDownloadableApp('SHA512SUMS')).toBe(false);
      expect(isDownloadableApp('rotki-v1.35.0.tar.gz')).toBe(false);
      expect(isDownloadableApp('rotki-backend-v1.35.0.zip')).toBe(false);
    });
  });

  describe('minimizePayload', () => {
    it('strips extra fields from GitHub response', () => {
      const fullResponse = createMockGithubResponse('v1.35.0', [
        { name: 'rotki-linux.AppImage', url: 'https://linux-url' },
        { name: 'rotki-win32.exe', url: 'https://windows-url' },
      ]);

      const result = minimizePayload(fullResponse);

      expect(Object.keys(result).sort()).toEqual(['assets', 'tag_name']);
      const firstAsset = result.assets[0];
      expect(firstAsset).toBeDefined();
      expect(Object.keys(firstAsset!).sort()).toEqual(['browser_download_url', 'name']);
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('body');
    });

    it('filters out non-downloadable assets', () => {
      const fullResponse = createMockGithubResponse('v1.35.0', [
        { name: 'rotki-linux.AppImage', url: 'https://linux-url' },
        { name: 'rotki-win32.exe', url: 'https://windows-url' },
        { name: 'rotki-darwin-x64.dmg', url: 'https://mac-x64-url' },
        { name: 'rotki-darwin-arm64.dmg', url: 'https://mac-arm64-url' },
        { name: 'CHANGELOG.md', url: 'https://changelog-url' },
        { name: 'SHA512SUMS', url: 'https://sums-url' },
        { name: 'rotki-backend.tar.gz', url: 'https://backend-url' },
      ]);

      const result = minimizePayload(fullResponse);

      expect(result.assets).toHaveLength(4);
      expect(result.assets.map(a => a.name)).toEqual([
        'rotki-linux.AppImage',
        'rotki-win32.exe',
        'rotki-darwin-x64.dmg',
        'rotki-darwin-arm64.dmg',
      ]);
    });

    it('handles empty assets array', () => {
      const result = minimizePayload({ tag_name: 'v1.0.0', assets: [] });
      expect(result.assets).toHaveLength(0);
    });

    it('handles response with no downloadable assets', () => {
      const fullResponse = createMockGithubResponse('v1.35.0', [
        { name: 'CHANGELOG.md', url: 'https://changelog-url' },
        { name: 'SHA512SUMS', url: 'https://sums-url' },
      ]);

      const result = minimizePayload(fullResponse);
      expect(result.assets).toHaveLength(0);
    });

    it('preserves order of downloadable assets', () => {
      const fullResponse = createMockGithubResponse('v1.35.0', [
        { name: 'rotki-linux.AppImage', url: 'https://linux' },
        { name: 'rotki-darwin-x64.dmg', url: 'https://mac' },
        { name: 'rotki-win32.exe', url: 'https://win' },
      ]);

      const result = minimizePayload(fullResponse);
      expect(result.assets[0]?.name).toContain('linux');
      expect(result.assets[1]?.name).toContain('darwin');
      expect(result.assets[2]?.name).toContain('win32');
    });
  });

  describe('handler caching behavior', () => {
    it('returns cached data when cache hit', async () => {
      const cachedRelease = { tag_name: 'v1.35.0', assets: [] };
      mockCache.getItem.mockResolvedValueOnce(cachedRelease);

      const result = await handler(createMockEvent());

      expect(result).toEqual(cachedRelease);
      expect(mockFetchRaw).not.toHaveBeenCalled();
    });

    it('fetches from GitHub when cache miss and caches the result', async () => {
      const githubResponse = createMockGithubResponse('v1.35.0', [
        { name: 'rotki-linux.AppImage', url: 'https://linux-url' },
      ]);

      mockCache.getItem.mockResolvedValue(null);
      mockFetchRaw.mockResolvedValueOnce({
        _data: githubResponse,
        status: 200,
        headers: new Headers({ etag: '"abc123"' }),
      });

      const result = await handler(createMockEvent());

      expect(result.tag_name).toBe('v1.35.0');
      expect(result.assets).toHaveLength(1);
      expect(mockCache.setItem).toHaveBeenCalled();
    });

    it('uses stored ETag for conditional requests', async () => {
      const storedEtag = '"stored-etag-123"';
      mockCache.getItem
        .mockResolvedValueOnce(null) // Primary cache miss
        .mockResolvedValueOnce(storedEtag); // Return stored ETag

      mockFetchRaw.mockResolvedValueOnce({
        _data: createMockGithubResponse('v1.35.0', []),
        status: 200,
        headers: new Headers({ etag: '"new-etag"' }),
      });

      await handler(createMockEvent());

      expect(mockFetchRaw).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': storedEtag,
          }),
        }),
      );
    });

    it('returns stale data and refreshes cache on 304 Not Modified response', async () => {
      const staleRelease = { tag_name: 'v1.35.0', assets: [{ name: 'test.AppImage', browser_download_url: 'https://test' }] };
      const storedEtag = '"etag-unchanged"';

      mockCache.getItem
        .mockResolvedValueOnce(null) // Primary cache miss
        .mockResolvedValueOnce(storedEtag) // Return stored ETag
        .mockResolvedValueOnce(staleRelease); // Return stale data for 304 handling

      // GitHub returns 304 Not Modified
      mockFetchRaw.mockResolvedValueOnce({
        _data: null,
        status: 304,
        headers: new Headers(),
      });

      const result = await handler(createMockEvent());

      // Should return the stale data
      expect(result).toEqual(staleRelease);

      // Should refresh the primary cache TTL
      expect(mockCache.setItem).toHaveBeenCalledWith(
        'github:releases:latest',
        staleRelease,
        expect.objectContaining({ ttl: expect.any(Number) }),
      );
    });

    it('returns stale data when GitHub API fails', async () => {
      const staleRelease = { tag_name: 'v1.34.0', assets: [] };

      mockCache.getItem
        .mockResolvedValueOnce(null) // Primary cache miss
        .mockResolvedValueOnce(null) // No ETag
        .mockResolvedValueOnce(staleRelease); // Stale cache hit

      mockFetchRaw.mockRejectedValueOnce(new Error('GitHub API error'));

      const result = await handler(createMockEvent());

      expect(result).toEqual(staleRelease);
    });

    it('throws error when GitHub fails and no stale data available', async () => {
      mockCache.getItem.mockResolvedValue(null);
      mockFetchRaw.mockRejectedValueOnce(new Error('GitHub API error'));

      await expect(handler(createMockEvent())).rejects.toThrow();
    });
  });
});
