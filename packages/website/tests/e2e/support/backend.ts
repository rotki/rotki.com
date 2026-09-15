import type { Page, Request, Route } from '@playwright/test';
import {
  type AccountWire,
  type AvailableTiersWire,
  type BreakdownWire,
  cryptoOptionsFor,
  type CryptoOptionWire,
  cryptoPaymentFor,
  type CryptoPaymentWire,
  defaultAccount,
  defaultBreakdown,
  defaultTiers,
  defaultTiersInfo,
  defaultUpgradePayment,
  ETH_ON_BASE,
  ETH_ON_ETHEREUM,
  type PendingPaymentWire,
  type SubscriptionWire,
  type TierInfoWire,
  type UpgradePaymentWire,
  USDC_ON_BASE,
  USDC_ON_ETHEREUM,
} from './backend-data';

/** How a mocked endpoint answers: `'ok'`, or an HTTP error with an optional backend `message`. */
export type ApiOutcome = 'ok' | { status: number; message?: string };

/** Everything the fake backend answers with. Change it before navigating, or at any time with `update`. */
export interface BackendScenario {
  account: AccountWire;
  subscriptions: SubscriptionWire[];
  tiers: AvailableTiersWire;
  tiersInfo: TierInfoWire[];
  breakdown: BreakdownWire;
  cryptoOptions: Record<string, Record<string, CryptoOptionWire>>;
  payment: CryptoPaymentWire;
  createPayment: ApiOutcome;
  createUpgrade: ApiOutcome;
  pending: PendingPaymentWire;
  pendingLookup: ApiOutcome;
  upgrade: UpgradePaymentWire;
  upgradeLookup: ApiOutcome;
  markStarted: ApiOutcome;
  deletePending: ApiOutcome;
  cancelUpgrade: ApiOutcome;
}

/** A request the fake backend received. */
export interface RecordedCall {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
}

/** Test-side handle on the fake backend. */
export interface FakeBackend {
  /** Calls answered by the fake, in order. */
  readonly calls: readonly RecordedCall[];
  /** Backend calls the fake has no handler for; they fall through to the mock API server. */
  readonly unhandled: readonly RecordedCall[];
  update: (patch: Partial<BackendScenario>) => void;
  callsTo: (method: string, path: string) => RecordedCall[];
}

interface MockResponse {
  status: number;
  json: unknown;
}

type Handler = (scenario: BackendScenario) => MockResponse;

const PAYMENT_LOG_PATH = '/api/logging/payment';

const SIGIL_ORIGIN = 'https://sigil.rotki.com';

/** A backend ready for a new crypto purchase paid with ETH on Ethereum. */
export function defaultBackendScenario(): BackendScenario {
  return {
    account: defaultAccount(),
    breakdown: defaultBreakdown(),
    cancelUpgrade: 'ok',
    createPayment: 'ok',
    createUpgrade: 'ok',
    cryptoOptions: cryptoOptionsFor([ETH_ON_ETHEREUM, USDC_ON_ETHEREUM, ETH_ON_BASE, USDC_ON_BASE]),
    deletePending: 'ok',
    markStarted: 'ok',
    payment: cryptoPaymentFor(ETH_ON_ETHEREUM),
    pending: { pending: false, transaction_started: false },
    pendingLookup: 'ok',
    subscriptions: [],
    tiers: defaultTiers(),
    tiersInfo: defaultTiersInfo(),
    upgrade: defaultUpgradePayment(),
    upgradeLookup: 'ok',
  };
}

function ok(json: unknown): MockResponse {
  return { json, status: 200 };
}

/** Answers with `json` for `'ok'`, or with the backend's error body for a failing outcome. */
function withOutcome(outcome: ApiOutcome, json: unknown): MockResponse {
  if (outcome === 'ok')
    return ok(json);
  return { json: { message: outcome.message ?? 'Mocked backend failure', result: false }, status: outcome.status };
}

const HANDLERS: Record<string, Handler> = {
  'DELETE /webapi/2/crypto/payment/pending/': s => withOutcome(s.deletePending, { result: true }),
  'GET /webapi/2/available-tiers': s => ok(s.tiers),
  'GET /webapi/2/crypto/payment/pending/': s => withOutcome(s.pendingLookup, { result: s.pending }),
  'GET /webapi/2/crypto/payment/upgrade/': s => withOutcome(s.upgradeLookup, { result: s.upgrade }),
  'GET /webapi/2/history/payments/': () => ok({ result: [] }),
  'GET /webapi/2/history/subscriptions': s => ok({ result: s.subscriptions }),
  'GET /webapi/2/tiers/info': s => ok(s.tiersInfo),
  'GET /webapi/account/': s => ok({ result: s.account }),
  'GET /webapi/csrf/': () => ok({ detail: 'CSRF cookie set' }),
  'GET /webapi/payment/crypto/options/': s => ok(s.cryptoOptions),
  'PATCH /webapi/2/crypto/payment/pending/': s => withOutcome(s.markStarted, { result: true }),
  'PATCH /webapi/2/crypto/payment/upgrade/': s => withOutcome(s.markStarted, { result: true }),
  'POST /api/logging/payment': () => ok({}),
  'POST /webapi/2/crypto/payments': s => withOutcome(s.createPayment, { result: s.payment }),
  'POST /webapi/2/crypto/upgrade': s => withOutcome(s.createUpgrade, { result: s.payment }),
  'POST /webapi/2/crypto/upgrade/cancel': s => withOutcome(s.cancelUpgrade, { result: true }),
  'POST /webapi/2/payment/breakdown': s => ok(s.breakdown),
};

function readBody(request: Request): unknown {
  try {
    return request.postDataJSON();
  }
  catch {
    return request.postData();
  }
}

function toRecordedCall(request: Request): RecordedCall {
  const url = new URL(request.url());
  return {
    body: readBody(request),
    method: request.method(),
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
  };
}

function isBackendRequest(url: URL): boolean {
  return url.hostname === 'localhost' && (url.pathname.startsWith('/webapi/') || url.pathname === PAYMENT_LOG_PATH);
}

/**
 * Fakes the rotki backend for the checkout pages: every `/webapi` call the crypto flow makes, the
 * payment log endpoint and the sigil analytics script.
 *
 * @remarks
 * It also sets the `auth_hint` and `csrftoken` cookies, so authenticated pages fetch the account
 * instead of redirecting to login. Backend calls without a handler fall through to the mock API
 * server and are listed in `unhandled`.
 */
export async function installFakeBackend(page: Page, baseURL: string, overrides: Partial<BackendScenario> = {}): Promise<FakeBackend> {
  const scenario: BackendScenario = { ...defaultBackendScenario(), ...overrides };
  const calls: RecordedCall[] = [];
  const unhandled: RecordedCall[] = [];

  async function handle(route: Route): Promise<void> {
    const call = toRecordedCall(route.request());
    const handler = HANDLERS[`${call.method} ${call.path}`];
    if (!handler) {
      unhandled.push(call);
      await route.fallback();
      return;
    }
    calls.push(call);
    const { json, status } = handler(scenario);
    await route.fulfill({ json, status });
  }

  const { origin } = new URL(baseURL);
  await page.context().addCookies([
    { name: 'auth_hint', url: origin, value: '1' },
    { name: 'csrftoken', url: origin, value: 'e2e-csrf-token' },
  ]);
  await page.route(isBackendRequest, handle);
  await page.route(`${SIGIL_ORIGIN}/**`, async route => route.fulfill({ body: '', contentType: 'application/javascript', status: 200 }));

  return {
    calls,
    callsTo: (method, path) => calls.filter(call => call.method === method && call.path === path),
    unhandled,
    update: (patch) => {
      Object.assign(scenario, patch);
    },
  };
}
