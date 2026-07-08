import { createSharedComposable } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { fromZod } from 'plainfp/interop/zod';
import { pipe } from 'plainfp/pipe';
import { flatMap, fromThrowable, getOr, map, mapError, ok, type Result } from 'plainfp/result';
import * as RA from 'plainfp/result-async';
import { tag, type Tagged } from 'plainfp/tagged';
import { getAddress } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { z } from 'zod';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { messageOf } from '~/modules/web3/core/errors';
import { useLogger } from '~/utils/use-logger';

const SiweSessionSchema = z.object({
  address: z.string(),
  expiresAt: z.number(),
});

type SiweSession = z.infer<typeof SiweSessionSchema>;

/** Tagged, exhaustive failure union for the SIWE handshake. */
export type AuthError =
  | Tagged<'NonceFailed', { message: string; cause?: unknown }>
  | Tagged<'UserRejected', { message: string }>
  | Tagged<'SignFailed', { message: string }>
  | Tagged<'VerifyFailed', { message: string; cause?: unknown }>;

/** Backend `detail` fragments that signal an expired/missing SIWE cookie. */
const SIWE_ERROR_KEYS = [
  'Missing siwe cookie',
  'SIWE expired',
];

const AUTH_REQUIRED = 'Authentication required. Please sign the message to continue.';

/** Parse persisted session data through Zod; anything malformed reads as absent. */
const parseSession = fromZod(SiweSessionSchema);

/** True for the 403 "cookie expired" responses that warrant a re-auth + retry. */
function isSiweCookieError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null)
    return false;
  const statusCode = 'statusCode' in error ? error.statusCode : undefined;
  const data = 'data' in error ? error.data : undefined;
  const detail = typeof data === 'object' && data !== null && 'detail' in data ? data.detail : undefined;
  return statusCode === 403 && typeof detail === 'string' && SIWE_ERROR_KEYS.some(item => detail.includes(item));
}

/**
 * Shared so every consumer (wallet card, submission form, submissions list) reads
 * one `siwe_session` ref: signing in from the card must flip `isSessionValid` for
 * the form in the same tick. Separate instances relied on cross-instance storage
 * events that don't fire same-document, leaving the form disabled after sign-in.
 * Safe as a shared composable (unlike `useLazyAsyncData`): it only wraps
 * `useLocalStorage` + a `watch`, so a dispose/re-init just re-reads localStorage.
 */
export const useSiweAuth = createSharedComposable(useSiweAuthInternal);

function useSiweAuthInternal() {
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { address, connected, connectedChainId, signMessage: signMessageWeb3 } = useWallet();
  const logger = useLogger();

  const sessionStorage = useLocalStorage<SiweSession | undefined>('siwe_session', undefined, {
    serializer: {
      read: (v: string): SiweSession | undefined => v
        ? pipe(
            fromThrowable(() => JSON.parse(v)),
            flatMap(parseSession),
            getOr<SiweSession | undefined>(undefined),
          )
        : undefined,
      write: (v: SiweSession | undefined): string => JSON.stringify(v),
    },
  });

  const isAuthenticating = shallowRef<boolean>(false);
  const authError = shallowRef<string>('');

  function isSessionValid(address: string): boolean {
    const session = get(sessionStorage);
    if (!session || !address || session.address.toLowerCase() !== address.toLowerCase())
      return false;

    // Valid only if it expires more than a minute from now (clock-skew buffer).
    const now = Math.floor(Date.now() / 1000);
    return session.expiresAt > now + 60;
  }

  /** Step 1 — fetch a fresh nonce from the backend. */
  async function fetchNonce(): RA.ResultAsync<string, AuthError> {
    return pipe(
      RA.fromPromise(
        fetchWithCsrf<{ nonce: string }>('/webapi/nfts/siwe/nonce', { method: 'GET' }),
        (cause): AuthError => tag('NonceFailed')({ cause, message: 'Authentication failed' }),
      ),
      RA.map(response => response.nonce),
    );
  }

  /** Build an EIP-4361 (Sign-In With Ethereum) message bound to this origin + nonce. */
  function buildSiweMessage(address: string, nonce: string): string {
    // Only ever called client-side (behind a user-triggered wallet signature).
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const uri = typeof window !== 'undefined' ? window.location.origin : '';
    return createSiweMessage({
      address: getAddress(address),
      chainId: get(connectedChainId) ?? 1,
      domain: host,
      nonce,
      statement: 'Sign in with Ethereum to rotki.',
      uri,
      version: '1',
    });
  }

  /** Step 2 — build + sign the EIP-4361 message, translating wallet errors to {@link AuthError}. */
  async function signSiweMessage(address: string, nonce: string): Promise<Result<{ message: string; signature: string }, AuthError>> {
    const message = buildSiweMessage(address, nonce);
    return map(
      mapError(await signMessageWeb3(message), (error): AuthError => error._tag === 'UserRejected'
        ? tag('UserRejected')({ message: 'Signature rejected. Please try again.' })
        : tag('SignFailed')({ message: 'Failed to sign message. Please try again.' })),
      (signature): { message: string; signature: string } => ({ message, signature }),
    );
  }

  /** Step 3 — verify the signed message with the backend, yielding the persisted session. */
  async function verifySignature(message: string, signature: string): RA.ResultAsync<SiweSession, AuthError> {
    return pipe(
      RA.fromPromise(
        fetchWithCsrf<SiweSession & { ok: boolean }>('/webapi/nfts/siwe/verify', {
          body: { message, signature },
          method: 'POST',
        }),
        (cause): AuthError => tag('VerifyFailed')({ cause, message: messageOf(cause) }),
      ),
      RA.flatMap(async (response): RA.ResultAsync<SiweSession, AuthError> => response.ok
        ? RA.ok({ address: response.address, expiresAt: response.expiresAt })
        : RA.err(tag('VerifyFailed')({ message: 'Authentication failed' }))),
    );
  }

  async function authenticate(address: string): Promise<Result<void, AuthError>> {
    if (isSessionValid(address))
      return ok(undefined);

    set(isAuthenticating, true);
    set(authError, '');
    try {
      const outcome = await pipe(
        fetchNonce(),
        RA.flatMap(async nonce => pipe(
          signSiweMessage(address, nonce),
          RA.flatMap(async ({ message, signature }) => verifySignature(message, signature)),
        )),
        RA.tap((session) => { set(sessionStorage, session); }),
      );

      if (!outcome.ok)
        set(authError, outcome.error.message);

      return map(outcome, () => undefined);
    }
    finally {
      set(isAuthenticating, false);
    }
  }

  function clearSession(): void {
    set(sessionStorage, undefined);
  }

  // Clear the session when the wallet disconnects or switches to another address.
  watch([connected, address], ([isConnected, currentAddress]) => {
    const session = get(sessionStorage);
    if (!isConnected || (session && currentAddress && session.address.toLowerCase() !== currentAddress.toLowerCase()))
      clearSession();
  });

  /**
   * Run `requestFn` behind a valid SIWE session. On a 403 "cookie expired" reply
   * it clears the session, re-authenticates once and retries. Still throws on
   * auth failure (the consumers branch on the thrown error's status/message).
   */
  async function authenticatedRequest<T>(address: string, requestFn: () => Promise<T>): Promise<T> {
    if (!(await authenticate(address)).ok)
      throw new Error(AUTH_REQUIRED);

    try {
      return await requestFn();
    }
    catch (error) {
      if (!isSiweCookieError(error))
        throw error;

      logger.debug('Cookie expired on backend, forcing re-authentication');
      clearSession();
      if (!(await authenticate(address)).ok)
        throw new Error(AUTH_REQUIRED);

      return requestFn();
    }
  }

  return {
    authenticate,
    authenticatedRequest,
    authError: shallowReadonly(authError),
    clearSession,
    isAuthenticating: shallowReadonly(isAuthenticating),
    isSessionValid,
  };
}
