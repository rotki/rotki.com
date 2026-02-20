import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { get } from '@vueuse/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useRuntimeConfig } = vi.hoisted(() => ({
  useRuntimeConfig: vi.fn().mockReturnValue({
    app: { baseURL: '/', buildId: 'test' },
    public: {
      baseUrl: 'http://localhost:3000',
      testing: true,
      walletConnect: { projectId: 'test-project-id' },
    },
  }),
}));

mockNuxtImport('useRuntimeConfig', () => useRuntimeConfig);

describe('useWeb3Connection', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('should share reactive state across multiple instances', async () => {
    const { useWeb3Connection } = await import('~/composables/web3/use-web3-connection');
    const instance1 = useWeb3Connection();
    const instance2 = useWeb3Connection();

    expect(get(instance1.connected)).toBe(false);
    expect(get(instance2.connected)).toBe(false);

    expect(get(instance1.address)).toBeUndefined();
    expect(get(instance2.address)).toBeUndefined();

    // Both should reference the same underlying ref (toRaw comparison)
    expect(instance1.connected).toBe(instance2.connected);
    expect(instance1.address).toBe(instance2.address);
    expect(instance1.connectedChainId).toBe(instance2.connectedChainId);
    expect(instance1.initialized).toBe(instance2.initialized);
  });

  it('should keep per-instance errorMessage separate', async () => {
    const { useWeb3Connection } = await import('~/composables/web3/use-web3-connection');
    const instance1 = useWeb3Connection();
    const instance2 = useWeb3Connection();

    instance1.setError('error from instance 1');

    expect(get(instance1.errorMessage)).toBe('error from instance 1');
    expect(get(instance2.errorMessage)).toBe('');
  });

  it('should invoke per-instance onError callback from setError', async () => {
    const { useWeb3Connection } = await import('~/composables/web3/use-web3-connection');
    const onError1 = vi.fn();
    const onError2 = vi.fn();

    const instance1 = useWeb3Connection({ onError: onError1 });
    useWeb3Connection({ onError: onError2 });

    instance1.setError('test error');

    expect(onError1).toHaveBeenCalledWith('test error');
    expect(onError2).not.toHaveBeenCalled();
  });

  it('should throw when signMessage is called without connection', async () => {
    const { useWeb3Connection } = await import('~/composables/web3/use-web3-connection');
    const instance = useWeb3Connection();

    await expect(instance.signMessage('test')).rejects.toThrow('Wallet not connected');
  });

  it('should throw when getSigner is called without connection', async () => {
    const { useWeb3Connection } = await import('~/composables/web3/use-web3-connection');
    const instance = useWeb3Connection();

    await expect(instance.getSigner()).rejects.toThrow('Wallet not connected');
  });
});
