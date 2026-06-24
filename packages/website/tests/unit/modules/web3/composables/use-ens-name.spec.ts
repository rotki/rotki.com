import { err, ok } from 'plainfp/result';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useEnsName } from '~/modules/web3/composables/use-ens-name';
import { resolveEnsName } from '~/modules/web3/core/ens';
import { cacheEnsName, resetEnsCache } from '~/modules/web3/core/ens-cache';
import { validation } from '~/modules/web3/core/errors';

const ADDRESS_A = '0xaaaa000000000000000000000000000000000000';
const ADDRESS_B = '0xbbbb000000000000000000000000000000000000';

// The composable dynamically imports core/ens; vi.mock intercepts that too.
vi.mock('~/modules/web3/core/ens', () => ({
  resolveEnsName: vi.fn(),
}));

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({ error: vi.fn() }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Mount the composable inside an effect scope so its watcher is owned/cleanable,
// then let the 300ms debounce fire and any in-flight resolve settle.
function mount(address: Parameters<typeof useEnsName>[0]) {
  const scope = effectScope();
  const result = scope.run(() => useEnsName(address))!;
  return { ...result, stop: () => scope.stop() };
}

describe('useEnsName', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(resolveEnsName).mockReset();
    resetEnsCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves the name for the initial address once the debounce elapses', async () => {
    vi.mocked(resolveEnsName).mockResolvedValue(ok('rotki.eth'));
    const { ensName, stop } = mount(ref(ADDRESS_A));

    await vi.advanceTimersByTimeAsync(300);

    expect(resolveEnsName).toHaveBeenCalledWith(ADDRESS_A);
    expect(ensName.value).toBe('rotki.eth');
    stop();
  });

  it('seeds a cached name synchronously, without a debounce wait or lookup', async () => {
    cacheEnsName(ADDRESS_A, 'cached.eth');
    const { ensName, loading, stop } = mount(ref(ADDRESS_A));

    // No timer advance: the name is present on the first synchronous tick.
    expect(ensName.value).toBe('cached.eth');
    expect(loading.value).toBe(false);

    await vi.advanceTimersByTimeAsync(300);
    expect(resolveEnsName).not.toHaveBeenCalled();
    stop();
  });

  it('seeds a cached miss (no name) synchronously, without re-querying', async () => {
    cacheEnsName(ADDRESS_A, undefined);
    const { ensName, loading, stop } = mount(ref(ADDRESS_A));

    expect(ensName.value).toBeUndefined();
    expect(loading.value).toBe(false);

    await vi.advanceTimersByTimeAsync(300);
    expect(resolveEnsName).not.toHaveBeenCalled();
    stop();
  });

  it('does not query and clears the name when the address is undefined', async () => {
    const { ensName, stop } = mount(ref<string>());

    await vi.advanceTimersByTimeAsync(300);

    expect(resolveEnsName).not.toHaveBeenCalled();
    expect(ensName.value).toBeUndefined();
    stop();
  });

  it('debounces rapid address changes into a single lookup', async () => {
    vi.mocked(resolveEnsName).mockResolvedValue(ok('rotki.eth'));
    const address = ref<string>(ADDRESS_A);
    const { stop } = mount(address);

    address.value = ADDRESS_B;
    await nextTick();
    await vi.advanceTimersByTimeAsync(300);

    expect(resolveEnsName).toHaveBeenCalledTimes(1);
    expect(resolveEnsName).toHaveBeenCalledWith(ADDRESS_B);
    stop();
  });

  it('swallows resolution errors and leaves the name undefined', async () => {
    vi.mocked(resolveEnsName).mockResolvedValue(err(validation('boom')));
    const { ensName, loading, stop } = mount(ref(ADDRESS_A));

    await vi.advanceTimersByTimeAsync(300);

    expect(ensName.value).toBeUndefined();
    expect(loading.value).toBe(false);
    stop();
  });

  it('toggles loading around an in-flight lookup', async () => {
    const pending = deferred<ReturnType<typeof ok<string | undefined>>>();
    vi.mocked(resolveEnsName).mockReturnValue(pending.promise);
    const { loading, stop } = mount(ref(ADDRESS_A));

    await vi.advanceTimersByTimeAsync(300);
    expect(loading.value).toBe(true);

    pending.resolve(ok('rotki.eth'));
    await vi.advanceTimersByTimeAsync(0);
    expect(loading.value).toBe(false);
    stop();
  });

  it('drops a stale response when a newer address arrives mid-flight', async () => {
    const first = deferred<ReturnType<typeof ok<string | undefined>>>();
    const second = deferred<ReturnType<typeof ok<string | undefined>>>();
    vi.mocked(resolveEnsName)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const address = ref<string>(ADDRESS_A);
    const { ensName, stop } = mount(address);

    // First lookup (address A) is now in flight.
    await vi.advanceTimersByTimeAsync(300);

    // Switch to B and let its lookup start before A's response lands.
    address.value = ADDRESS_B;
    await nextTick();
    await vi.advanceTimersByTimeAsync(300);

    // A resolves late — must be ignored since B is the current address.
    first.resolve(ok('stale.eth'));
    await vi.advanceTimersByTimeAsync(0);
    expect(ensName.value).not.toBe('stale.eth');

    second.resolve(ok('fresh.eth'));
    await vi.advanceTimersByTimeAsync(0);
    expect(ensName.value).toBe('fresh.eth');
    stop();
  });
});
