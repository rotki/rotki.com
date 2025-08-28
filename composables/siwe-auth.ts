import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useWeb3Connection } from '~/composables/web3-connection';
import { useLogger } from '~/utils/use-logger';

interface SiweSession {
  address: string;
  expiresAt: number;
}

const SIWE_ERROR_KEYS = [
  'Missing siwe cookie',
  'SIWE expired',
];

export function useSiweAuth() {
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { address, connected, signMessage: signMessageWeb3 } = useWeb3Connection();
  const logger = useLogger();

  const siweSessionKey = 'siwe_session';
  const sessionStorage = useLocalStorage<SiweSession | null>(siweSessionKey, null, {
    serializer: {
      read: (v: any) => v ? JSON.parse(v) : null,
      write: (v: any) => JSON.stringify(v),
    },
  });

  const isAuthenticating = ref<boolean>(false);
  const authError = ref<string>('');

  function isSessionValid(address: string): boolean {
    const session = get(sessionStorage);
    if (!session || !session.address || !address)
      return false;

    // Check if session is for the same address
    if (session.address.toLowerCase() !== address.toLowerCase())
      return false;

    // Check if session is expired (with 1 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    return session.expiresAt > (now + 60); // Session valid if expires more than 1 minutes from now
  }

  async function authenticate(address: string): Promise<boolean> {
    // Check if we already have a valid session
    if (isSessionValid(address)) {
      return true;
    }

    try {
      set(isAuthenticating, true);
      set(authError, '');

      // Step 1: Get nonce from backend
      const nonceResponse = await fetchWithCsrf<{ nonce: string }>('/webapi/nfts/siwe/nonce', {
        method: 'GET',
      });

      const nonce = nonceResponse.nonce;

      // Step 2: Sign message with the nonce
      const message = `I am the owner of address ${address}. Nonce: ${nonce}`;
      let signature: string;

      try {
        signature = await signMessageWeb3(message);
      }
      catch (signError: any) {
        if (signError?.code === 4001 || signError?.message?.includes('reject')) {
          set(authError, 'Signature rejected. Please try again.');
        }
        else {
          set(authError, 'Failed to sign message. Please try again.');
        }
        return false;
      }

      // Step 3: Verify signature with backend to set cookie
      const verifyResponse = await fetchWithCsrf<SiweSession & { ok: boolean }>('/webapi/nfts/siwe/verify', {
        body: {
          evmAddress: address,
          nonce,
          signature,
        },
        method: 'POST',
      });

      if (verifyResponse.ok) {
        // Store session info in localStorage
        const sessionData = {
          address: verifyResponse.address,
          expiresAt: verifyResponse.expiresAt,
        };

        set(sessionStorage, sessionData);
        return true;
      }

      set(authError, 'Authentication failed');
      return false;
    }
    catch (error: any) {
      logger.error('SIWE authentication error:', error);
      set(authError, error.data?.message || 'Authentication failed');
      return false;
    }
    finally {
      set(isAuthenticating, false);
    }
  }

  function clearSession(): void {
    set(sessionStorage, null);
  }

  // Clear session when wallet disconnects or address changes
  watch([connected, address], ([isConnected, currentAddress]) => {
    const session = get(sessionStorage);
    if (!isConnected || (session && session.address && currentAddress && session.address.toLowerCase() !== currentAddress.toLowerCase())) {
      clearSession();
    }
  });

  async function authenticatedRequest<T>(
    address: string,
    requestFn: () => Promise<T>,
  ): Promise<T> {
    // Ensure we're authenticated first
    let authenticated = await authenticate(address);
    if (!authenticated) {
      throw new Error('Authentication required. Please sign the message to continue.');
    }

    try {
      // Try the request
      return await requestFn();
    }
    catch (error: any) {
      // If we get 403 with missing cookie, force re-authentication and retry
      if (error.statusCode === 403 && SIWE_ERROR_KEYS.some(item => error.data?.detail?.includes(item))) {
        logger.debug('Cookie expired on backend, forcing re-authentication');

        // Clear the session and try to authenticate again
        clearSession();

        authenticated = await authenticate(address);
        if (!authenticated) {
          throw new Error('Authentication required. Please sign the message to continue.');
        }

        // Retry the request
        return requestFn();
      }

      // Re-throw other errors
      throw error;
    }
  }

  return {
    authenticate,
    authenticatedRequest,
    authError,
    clearSession,
    isAuthenticating,
    isSessionValid,
  };
}
