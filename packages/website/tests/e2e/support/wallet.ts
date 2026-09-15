import type { Page } from '@playwright/test';

/** How the wallet answers a connection request. */
export type ConnectBehavior = 'ok' | 'reject';

/** How the wallet answers `wallet_switchEthereumChain`; `unrecognized` fails with 4902 until the chain is added. */
export type SwitchChainBehavior = 'ok' | 'reject' | 'unrecognized' | 'error';

/** How the wallet answers `wallet_addEthereumChain`. */
export type AddChainBehavior = 'ok' | 'reject';

/** How the wallet answers `eth_sendTransaction`; `hang` never answers, like an unconfirmed wallet prompt. */
export type SendBehavior = 'ok' | 'reject' | 'insufficientFunds' | 'error' | 'hang';

/** How the wallet answers `personal_sign`. */
export type SignBehavior = 'ok' | 'reject';

/** Per-method answers of the fake wallet. */
export interface WalletBehavior {
  connect: ConnectBehavior;
  switchChain: SwitchChainBehavior;
  addChain: AddChainBehavior;
  sendTransaction: SendBehavior;
  signMessage: SignBehavior;
}

/** Identity, starting chain and behavior of the fake wallet. */
export interface FakeWalletOptions {
  address: string;
  chainId: number;
  name: string;
  rdns: string;
  behavior: WalletBehavior;
}

/** An EIP-1193 request the page made to the wallet. */
export interface WalletRequest {
  method: string;
  params: unknown;
}

/** Parameters of an `eth_sendTransaction` request. */
export interface SentTransaction {
  from: string;
  to: string;
  value?: string;
  data?: string;
}

/** Test-side handle on the fake wallet. */
export interface FakeWallet {
  readonly options: FakeWalletOptions;
  /** Changes how the wallet answers from now on, including after page reloads. */
  setBehavior: (patch: Partial<WalletBehavior>) => Promise<void>;
  /** Switches the chain from inside the wallet, as a user would, and emits `chainChanged`. */
  switchChainInWallet: (chainId: number) => Promise<void>;
  requests: () => Promise<WalletRequest[]>;
  sentTransactions: () => Promise<SentTransaction[]>;
}

interface FakeWalletHandle {
  requests: WalletRequest[];
  setBehavior: (patch: Partial<WalletBehavior>) => void;
  setChain: (chainId: number) => void;
}

declare global {
  interface Window {
    __fakeWallet?: FakeWalletHandle;
  }
}

function isSentTransaction(value: unknown): value is SentTransaction {
  return typeof value === 'object' && value !== null
    && 'from' in value && typeof value.from === 'string'
    && 'to' in value && typeof value.to === 'string';
}

/** The fake wallet address used by default. */
export const WALLET_ADDRESS = '0x2222222222222222222222222222222222222222';

/** A connected-on-request wallet on Ethereum that approves everything. */
export function defaultWalletOptions(): FakeWalletOptions {
  return {
    address: WALLET_ADDRESS,
    behavior: { addChain: 'ok', connect: 'ok', sendTransaction: 'ok', signMessage: 'ok', switchChain: 'ok' },
    chainId: 1,
    name: 'E2E Wallet',
    rdns: 'com.rotki.e2e-wallet',
  };
}

/**
 * Runs inside the page before any app code. It is serialized by Playwright, so it must not use
 * anything from the enclosing module.
 *
 * @remarks
 * Wallet state (behavior, chain, connection, added chains) is kept in localStorage so it survives the
 * full page loads the checkout does between its CSP-restricted routes.
 */
function installWalletInPage(options: FakeWalletOptions): void {
  const storageKey = 'e2e.fake-wallet';
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const requests: WalletRequest[] = [];
  const state = { addedChains: [options.chainId], behavior: { ...options.behavior }, chainId: options.chainId, connected: false, txCount: 0 };

  try {
    Object.assign(state, JSON.parse(localStorage.getItem(storageKey) ?? '{}'));
  }
  catch {}

  const save = (): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
    catch {}
  };
  const toHex = (value: number): string => `0x${value.toString(16)}`;
  const rpcError = (code: number, message: string): Error => Object.assign(new Error(message), { code });
  const rejected = (): Error => rpcError(4001, 'User rejected the request.');
  const emit = (event: string, payload: unknown): void => {
    for (const listener of listeners.get(event) ?? [])
      listener(payload);
  };
  const setChain = (chainId: number): void => {
    state.chainId = chainId;
    save();
    emit('chainChanged', toHex(chainId));
  };
  const permissions = (): unknown[] => [{ caveats: [{ type: 'restrictReturnedAccounts', value: [options.address] }], parentCapability: 'eth_accounts' }];
  const connect = (): string[] => {
    if (state.behavior.connect === 'reject')
      throw rejected();
    state.connected = true;
    save();
    return [options.address];
  };
  const requestedChainId = (params: unknown): number => {
    const [first] = Array.isArray(params) ? params : [];
    const chainId = typeof first === 'object' && first !== null && 'chainId' in first ? first.chainId : undefined;
    return Number.parseInt(String(chainId), 16);
  };
  const switchChain = (params: unknown): null => {
    const chainId = requestedChainId(params);
    const behavior = state.behavior.switchChain;
    if (behavior === 'reject')
      throw rejected();
    if (behavior === 'error')
      throw rpcError(-32603, 'Internal JSON-RPC error.');
    if (behavior === 'unrecognized' && !state.addedChains.includes(chainId))
      throw rpcError(4902, `Unrecognized chain ID "${toHex(chainId)}".`);
    setChain(chainId);
    return null;
  };
  const addChain = (params: unknown): null => {
    if (state.behavior.addChain === 'reject')
      throw rejected();
    const chainId = requestedChainId(params);
    state.addedChains.push(chainId);
    setChain(chainId);
    return null;
  };
  const sendTransaction = async (): Promise<string> => {
    const behavior = state.behavior.sendTransaction;
    if (behavior === 'hang')
      return new Promise<string>(() => {});
    if (behavior === 'reject')
      throw rejected();
    if (behavior === 'insufficientFunds')
      throw rpcError(-32000, 'insufficient funds for gas * price + value');
    if (behavior === 'error')
      throw rpcError(-32603, 'Internal JSON-RPC error.');
    state.txCount += 1;
    save();
    return `0x${state.txCount.toString(16).padStart(64, '0')}`;
  };
  const signMessage = (): string => {
    if (state.behavior.signMessage === 'reject')
      throw rejected();
    return `0x${'1b'.repeat(65)}`;
  };
  const methods: Record<string, (params: unknown) => unknown> = {
    eth_accounts: () => (state.connected ? [options.address] : []),
    eth_blockNumber: () => '0x1',
    eth_chainId: () => toHex(state.chainId),
    eth_requestAccounts: () => connect(),
    eth_sendTransaction: async () => sendTransaction(),
    net_version: () => String(state.chainId),
    personal_sign: () => signMessage(),
    wallet_addEthereumChain: params => addChain(params),
    wallet_getPermissions: () => (state.connected ? permissions() : []),
    wallet_requestPermissions: () => {
      connect();
      return permissions();
    },
    wallet_revokePermissions: () => {
      state.connected = false;
      save();
      return null;
    },
    wallet_switchEthereumChain: params => switchChain(params),
  };
  const provider = {
    on: (event: string, listener: (payload: unknown) => void): void => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
    },
    removeListener: (event: string, listener: (payload: unknown) => void): void => {
      listeners.get(event)?.delete(listener);
    },
    request: async ({ method, params }: { method: string; params?: unknown }): Promise<unknown> => {
      requests.push({ method, params });
      const handler = methods[method];
      if (!handler)
        throw rpcError(4200, `Unsupported method: ${method}`);
      return handler(params);
    },
  };
  const info = {
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/%3E',
    name: options.name,
    rdns: options.rdns,
    uuid: '00000000-0000-4000-8000-00000000e2e0',
  };
  const announce = (): void => {
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
  };

  Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });
  window.__fakeWallet = {
    requests,
    setBehavior: (patch) => {
      Object.assign(state.behavior, patch);
      save();
    },
    setChain,
  };
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
}

/**
 * Injects a fake EIP-1193 wallet into every page of the test, announced through EIP-6963 so the
 * wallet picker lists it by `options.name`.
 */
export async function installFakeWallet(page: Page, options: FakeWalletOptions): Promise<FakeWallet> {
  await page.addInitScript(installWalletInPage, options);
  return {
    options,
    requests: async () => page.evaluate(() => [...(window.__fakeWallet?.requests ?? [])]),
    sentTransactions: async () => {
      const params = await page.evaluate(() => (window.__fakeWallet?.requests ?? [])
        .filter(request => request.method === 'eth_sendTransaction')
        .map(request => (Array.isArray(request.params) ? request.params[0] : undefined)));
      return params.filter(isSentTransaction);
    },
    setBehavior: async (patch) => {
      Object.assign(options.behavior, patch);
      await page.evaluate(behavior => window.__fakeWallet?.setBehavior(behavior), patch);
    },
    switchChainInWallet: async (chainId) => {
      await page.evaluate(id => window.__fakeWallet?.setChain(id), chainId);
    },
  };
}
