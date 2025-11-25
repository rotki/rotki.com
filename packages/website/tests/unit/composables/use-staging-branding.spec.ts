import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { get } from '@vueuse/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useRuntimeConfig } = vi.hoisted(() => ({
  useRuntimeConfig: vi.fn(),
}));

const { useRequestURL } = vi.hoisted(() => ({
  useRequestURL: vi.fn(),
}));

mockNuxtImport('useRuntimeConfig', () => useRuntimeConfig);
mockNuxtImport('useRequestURL', () => useRequestURL);
mockNuxtImport('useHead', () => vi.fn());

function mockWindowHostname(hostname: string): () => void {
  const originalWindow = globalThis.window;
  // @ts-expect-error - mocking partial window for testing
  globalThis.window = { location: { hostname } };
  return (): void => {
    globalThis.window = originalWindow;
  };
}

describe('useStagingBranding', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('production environment (rotki.com)', () => {
    it('should return isStaging as false for rotki.com', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('https://rotki.com'));

      const restore = mockWindowHostname('rotki.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(false);

      restore();
    });

    it('should return isStaging as false for www.rotki.com', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('https://www.rotki.com'));

      const restore = mockWindowHostname('www.rotki.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(false);

      restore();
    });
  });

  describe('staging environment (staging.rotki.com)', () => {
    it('should return isStaging as true for staging.rotki.com', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('https://staging.rotki.com'));

      const restore = mockWindowHostname('staging.rotki.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(true);

      restore();
    });
  });

  describe('localhost environment', () => {
    it('should return isStaging as true for localhost', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('http://localhost:3000'));

      const restore = mockWindowHostname('localhost');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(true);

      restore();
    });
  });

  describe('development mode', () => {
    it('should return isStaging as true when isDev is true regardless of hostname', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: true },
      });
      useRequestURL.mockReturnValue(new URL('https://rotki.com'));

      const restore = mockWindowHostname('rotki.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(true);

      restore();
    });
  });

  describe('other domains', () => {
    it('should return isStaging as false for other domains', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('https://example.com'));

      const restore = mockWindowHostname('example.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(false);

      restore();
    });

    it('should return isStaging as false for rotki subdomains that are not staging', async () => {
      useRuntimeConfig.mockReturnValue({
        public: { isDev: false },
      });
      useRequestURL.mockReturnValue(new URL('https://app.rotki.com'));

      const restore = mockWindowHostname('app.rotki.com');

      const { useStagingBranding } = await import('~/composables/use-staging-branding');
      const { isStaging } = useStagingBranding();

      expect(get(isStaging)).toBe(false);

      restore();
    });
  });
});
