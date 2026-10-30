import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const { mockFetchWithCsrf } = vi.hoisted(() => ({ mockFetchWithCsrf: vi.fn() }));

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useAuthHintCookie: () => ref(true),
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
}));

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

async function loadComposable() {
  const { useUserSubscriptions } = await import('~/composables/subscription/use-user-subscriptions');
  return useUserSubscriptions;
}

describe('useUserSubscriptions initialLoading', () => {
  afterEach(() => {
    clearNuxtData('user-subscriptions');
    clearNuxtState('user-subscriptions-settled');
    vi.clearAllMocks();
  });

  it('stays false for a caller created after the shared request finished', async () => {
    mockFetchWithCsrf.mockResolvedValue({ result: [] });
    const useUserSubscriptions = await loadComposable();

    const first = useUserSubscriptions();
    await flushPromises();
    await vi.waitFor(() => expect(first.initialLoading.value).toBe(false));

    const late = useUserSubscriptions();
    expect(late.initialLoading.value).toBe(false);
  });

  it('does not bring the skeleton back when an empty list is refreshed', async () => {
    mockFetchWithCsrf.mockResolvedValue({ result: [] });
    const useUserSubscriptions = await loadComposable();

    const { initialLoading, refresh } = useUserSubscriptions();
    await vi.waitFor(() => expect(initialLoading.value).toBe(false));

    let release: (value: unknown) => void = () => {};
    mockFetchWithCsrf.mockReturnValueOnce(new Promise((resolve) => {
      release = resolve;
    }));
    const pending = refresh();
    expect(initialLoading.value).toBe(false);

    release({ result: [] });
    await pending;
    expect(initialLoading.value).toBe(false);
  });
});
