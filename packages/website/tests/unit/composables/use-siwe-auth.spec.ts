import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { get } from '@vueuse/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithCsrf = vi.fn();
const mockSignMessage = vi.fn();

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

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
}));

vi.mock('~/modules/web3/composables/use-wallet', () => ({
  useWallet: () => ({
    address: ref<string>('0x1234567890abcdef1234567890abcdef12345678'),
    connected: ref<boolean>(true),
    connectedChainId: ref<number>(1),
    signMessage: mockSignMessage,
  }),
}));

// signMessage now returns a plain-fp Result, not a raw string / thrown error.
const okResult = (value: string) => ({ ok: true, value });
const errResult = (tag: string, message: string) => ({ error: { _tag: tag, message }, ok: false });

const TEST_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
// EIP-4361 requires an alphanumeric nonce of at least 8 characters.
const TEST_NONCE = 'testnonce123';
const TEST_SIGNATURE = '0xsignature';

describe('useSiweAuth', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should authenticate successfully', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({ nonce: TEST_NONCE })
      .mockResolvedValueOnce({
        address: TEST_ADDRESS,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        ok: true,
      });
    mockSignMessage.mockResolvedValueOnce(okResult(TEST_SIGNATURE));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, isSessionValid } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(true);
    expect(isSessionValid(TEST_ADDRESS)).toBe(true);

    expect(mockFetchWithCsrf).toHaveBeenCalledTimes(2);
    // Signs a proper EIP-4361 message that embeds the nonce.
    expect(mockSignMessage).toHaveBeenCalledTimes(1);
    const signedMessage = String(mockSignMessage.mock.calls[0]?.[0] ?? '');
    expect(signedMessage).toContain('wants you to sign in with your Ethereum account:');
    expect(signedMessage).toContain(`Nonce: ${TEST_NONCE}`);

    // Verify is posted with the message + signature (not the legacy fields).
    expect(mockFetchWithCsrf).toHaveBeenLastCalledWith('/webapi/nfts/siwe/verify', {
      body: { message: signedMessage, signature: TEST_SIGNATURE },
      method: 'POST',
    });
  });

  it('should set authError when signature is rejected', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({ nonce: TEST_NONCE });
    mockSignMessage.mockResolvedValueOnce(errResult('UserRejected', 'User rejected'));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, authError } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(false);
    expect(get(authError)).toBe('Signature rejected. Please try again.');
  });

  it('should set authError when sign message fails', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({ nonce: TEST_NONCE });
    mockSignMessage.mockResolvedValueOnce(errResult('SignFailed', 'Unknown signing error'));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, authError } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(false);
    expect(get(authError)).toBe('Failed to sign message. Please try again.');
  });

  it('should set authError when nonce fetch fails', async () => {
    mockFetchWithCsrf.mockRejectedValueOnce(new Error('Network error'));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, authError } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(false);
    expect(get(authError)).toBeTruthy();
  });

  it('should set authError when verification fails', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({ nonce: TEST_NONCE })
      .mockResolvedValueOnce({ ok: false });
    mockSignMessage.mockResolvedValueOnce(okResult(TEST_SIGNATURE));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, authError } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(false);
    expect(get(authError)).toBe('Authentication failed');
  });

  it('should reset isAuthenticating after completion', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({ nonce: TEST_NONCE })
      .mockResolvedValueOnce({
        address: TEST_ADDRESS,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        ok: true,
      });
    mockSignMessage.mockResolvedValueOnce(okResult(TEST_SIGNATURE));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, isAuthenticating } = useSiweAuth();

    expect(get(isAuthenticating)).toBe(false);

    const promise = authenticate(TEST_ADDRESS);
    expect(get(isAuthenticating)).toBe(true);

    await promise;
    expect(get(isAuthenticating)).toBe(false);
  });

  it('should reset isAuthenticating after failure', async () => {
    mockFetchWithCsrf.mockRejectedValueOnce(new Error('fail'));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate, isAuthenticating } = useSiweAuth();

    await authenticate(TEST_ADDRESS);

    expect(get(isAuthenticating)).toBe(false);
  });

  it('should skip authentication when session is already valid', async () => {
    const session = {
      address: TEST_ADDRESS,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    localStorage.setItem('siwe_session', JSON.stringify(session));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { authenticate } = useSiweAuth();

    const result = await authenticate(TEST_ADDRESS);

    expect(result.ok).toBe(true);
    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
    expect(mockSignMessage).not.toHaveBeenCalled();
  });

  it('should reject expired sessions', async () => {
    const session = {
      address: TEST_ADDRESS,
      expiresAt: Math.floor(Date.now() / 1000) - 100,
    };
    localStorage.setItem('siwe_session', JSON.stringify(session));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { isSessionValid } = useSiweAuth();

    expect(isSessionValid(TEST_ADDRESS)).toBe(false);
  });

  it('should reject sessions for different addresses', async () => {
    const session = {
      address: '0xDIFFERENT',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    localStorage.setItem('siwe_session', JSON.stringify(session));

    const { useSiweAuth } = await import('~/modules/web3/sponsorship/use-siwe-auth');
    const { isSessionValid } = useSiweAuth();

    expect(isSessionValid(TEST_ADDRESS)).toBe(false);
  });
});
