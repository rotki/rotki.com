import type { CreateConnectorFn } from '@wagmi/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

// One fake UniversalProvider per init() call. Defined via vi.hoisted so the
// (hoisted) vi.mock factory can reference it.
const wc = vi.hoisted(() => {
  interface FakeProvider {
    session: unknown;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    setDefaultChain: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
  }

  const instances: FakeProvider[] = [];
  let nextSession: unknown;

  const init = vi.fn(async (): Promise<FakeProvider> => {
    const provider: FakeProvider = {
      // Pairing resolves and (in the real provider) populates `session`; the
      // wrapper reads accounts straight after, so set one when connect resolves.
      connect: vi.fn(async () => {}),
      disconnect: vi.fn(async () => {}),
      on: vi.fn(),
      removeListener: vi.fn(),
      request: vi.fn(async () => []),
      session: nextSession,
      setDefaultChain: vi.fn(),
    };
    instances.push(provider);
    return provider;
  });

  return {
    init,
    instances,
    reset: (): void => {
      instances.length = 0;
      init.mockClear();
      nextSession = undefined;
    },
    setNextSession: (session: unknown): void => {
      nextSession = session;
    },
  };
});

vi.mock('@walletconnect/universal-provider', () => ({
  UniversalProvider: { init: wc.init },
}));

const LIVE_SESSION = {
  namespaces: { eip155: { accounts: ['eip155:1:0x1234567890abcdef1234567890abcdef12345678'] } },
};

/** The fake provider created by the n-th init() call; throws if absent. */
function instance(index: number) {
  const provider = wc.instances[index];
  if (!provider)
    throw new Error(`no provider instance at ${index}`);
  return provider;
}

async function importConnector() {
  const { walletConnect } = await import('~/modules/web3/core/connectors/wallet-connect');
  const factory: CreateConnectorFn = walletConnect({
    metadata: { description: 'd', icons: [], name: 'rotki', url: 'https://rotki.com' },
    projectId: 'test-project',
  });
  // wagmi's createConnector returns the factory fn; call it with a minimal config.
  const config = {
    chains: [{ id: 1, rpcUrls: { default: { http: ['https://rpc.example'] } } }],
    emitter: { emit: vi.fn() },
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return factory(config as unknown as Parameters<CreateConnectorFn>[0]);
}

describe('walletConnect connector', () => {
  afterEach(() => {
    wc.reset();
  });

  it('throws on a silent reconnect with no restored session (never starts a pairing)', async () => {
    const connector = await importConnector();

    await expect(connector.connect({ isReconnecting: true })).rejects.toThrow(/no walletconnect session/i);

    // Crucially it must NOT have called the underlying pairing (no phantom QR).
    expect(instance(0).connect).not.toHaveBeenCalled();
  });

  it('resumes an existing session on reconnect without re-pairing', async () => {
    wc.setNextSession(LIVE_SESSION);
    const connector = await importConnector();

    const result = await connector.connect({ isReconnecting: true });

    expect(instance(0).connect).not.toHaveBeenCalled();
    expect(result.accounts.map((address: string) => address.toLowerCase()))
      .toContain('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('starts a pairing on a manual connect when there is no session', async () => {
    const connector = await importConnector();

    await connector.connect({});

    expect(instance(0).connect).toHaveBeenCalledTimes(1);
  });

  it('reuses an existing session on a manual connect (no fresh pairing)', async () => {
    wc.setNextSession(LIVE_SESSION);
    const connector = await importConnector();

    await connector.connect({});

    expect(instance(0).connect).not.toHaveBeenCalled();
  });

  it('binds each session listener exactly once per provider instance', async () => {
    const connector = await importConnector();

    await connector.getProvider();
    await connector.getProvider(); // cached — must not re-bind

    expect(wc.init).toHaveBeenCalledTimes(1);
    const events = instance(0).on.mock.calls.map(([event]) => event);
    expect(events.filter(event => event === 'disconnect')).toHaveLength(1);
    expect(events.filter(event => event === 'session_delete')).toHaveLength(1);
    expect(events.filter(event => event === 'accountsChanged')).toHaveLength(1);
    expect(events.filter(event => event === 'chainChanged')).toHaveLength(1);
  });
});
