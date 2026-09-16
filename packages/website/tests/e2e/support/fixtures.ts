import { test as base } from '@playwright/test';
import { type BackendScenario, type FakeBackend, installFakeBackend } from './backend';
import { type ChainScenario, type FakeChain, installFakeChain } from './rpc';
import { defaultWalletOptions, type FakeWallet, installFakeWallet, type WalletBehavior } from './wallet';

/** Wallet options a spec can override; `behavior` is merged with the defaults. */
export interface WalletOverrides {
  address?: string;
  chainId?: number;
  behavior?: Partial<WalletBehavior>;
}

interface PaymentOptions {
  backendScenario: Partial<BackendScenario>;
  walletOverrides: WalletOverrides;
  chainScenario: Partial<ChainScenario>;
}

interface PaymentFixtures {
  backend: FakeBackend;
  wallet: FakeWallet;
  chain: FakeChain;
}

/**
 * Playwright `test` with a fake backend, a fake injected wallet and fake chain nodes.
 *
 * @remarks
 * All three fakes install for every test, whether or not it asks for the handle — a test that only
 * drives the UI still needs the backend's session cookies and the injected wallet. Set the starting
 * scenario with `test.use` (`backendScenario`, `walletOverrides`, `chainScenario`), or change it
 * during the test through the fixture handles.
 */
export const test = base.extend<PaymentOptions & PaymentFixtures>({
  backend: [async ({ backendScenario, baseURL, page }, use) => {
    await use(await installFakeBackend(page, baseURL ?? 'http://localhost', backendScenario));
  }, { auto: true }],
  backendScenario: [{}, { option: true }],
  chain: [async ({ chainScenario, page }, use) => {
    await use(await installFakeChain(page, chainScenario));
  }, { auto: true }],
  chainScenario: [{}, { option: true }],
  wallet: [async ({ page, walletOverrides }, use) => {
    const defaults = defaultWalletOptions();
    await use(await installFakeWallet(page, {
      ...defaults,
      ...walletOverrides,
      behavior: { ...defaults.behavior, ...walletOverrides.behavior },
    }));
  }, { auto: true }],
  walletOverrides: [{}, { option: true }],
});
