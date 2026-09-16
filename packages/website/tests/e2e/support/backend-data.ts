/** Wallet address the backend asks the user to pay to. */
export const RECEIVING_ADDRESS = '0x1111111111111111111111111111111111111111';

/** A crypto asset offered by `/webapi/payment/crypto/options/`, plus the chain metadata the payment carries. */
export interface PaymentAsset {
  identifier: string;
  chainName: string;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  address?: string;
}

/** Native ETH on Ethereum mainnet. */
export const ETH_ON_ETHEREUM: PaymentAsset = {
  chainId: 1,
  chainName: 'ethereum',
  decimals: 18,
  identifier: 'ethereum:ETH',
  name: 'Ether',
  symbol: 'ETH',
};

/** USDC on Ethereum mainnet. */
export const USDC_ON_ETHEREUM: PaymentAsset = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: 1,
  chainName: 'ethereum',
  decimals: 6,
  identifier: 'ethereum:USDC',
  name: 'USD Coin',
  symbol: 'USDC',
};

/** Native ETH on Base. */
export const ETH_ON_BASE: PaymentAsset = {
  chainId: 8453,
  chainName: 'base',
  decimals: 18,
  identifier: 'base:ETH',
  name: 'Ether',
  symbol: 'ETH',
};

/** USDC on Base. */
export const USDC_ON_BASE: PaymentAsset = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chainId: 8453,
  chainName: 'base',
  decimals: 6,
  identifier: 'base:USDC',
  name: 'USD Coin',
  symbol: 'USDC',
};

/** Account as returned by `GET /webapi/account/` (snake_case wire format). */
export interface AccountWire {
  address: {
    address1: string;
    address2: string;
    city: string;
    company_name: string;
    country: string;
    first_name: string;
    last_name: string;
    moved_offline: boolean;
    postcode: string;
    vat_id: string;
  };
  api_key: string;
  api_secret: string;
  can_use_premium: boolean;
  date_now: string;
  email: string;
  email_confirmed: boolean;
  has_active_subscription: boolean;
  username: string;
  vat: number;
  vat_id_status: string;
}

/** Subscription as returned by `GET /webapi/2/history/subscriptions`. */
export interface SubscriptionWire {
  actions: string[];
  created_date: string;
  duration_in_months: number;
  id: string;
  is_active: boolean;
  is_legacy: boolean;
  is_soft_canceled?: boolean;
  next_action_date: string;
  next_billing_amount: number;
  payment_method?: 'paypal' | 'card' | 'crypto' | 'bank_transfer' | 'free';
  payment_provider: 'braintree' | 'bank' | 'crypto' | 'none';
  pending?: boolean;
  plan_id?: number;
  plan_name: string;
  status: 'Active' | 'Cancelled' | 'Cancelled but still active' | 'Pending' | 'Past Due' | 'Upgrade Requested' | 'Payment Failed';
}

/** Plan tiers as returned by `GET /webapi/2/available-tiers`. */
export interface AvailableTiersWire {
  settings: { country: string | null; is_authenticated: boolean };
  tiers: {
    tier_name: string;
    monthly_plan: { plan_id: number; price: string } | null;
    yearly_plan: { plan_id: number; price: string } | null;
    is_most_popular?: boolean;
  }[];
}

/** Plan details as returned by `GET /webapi/2/tiers/info`. */
export interface TierInfoWire {
  name: string;
  monthly_plan: { price: string; id: number };
  yearly_plan: { price: string; id: number };
  limits: {
    eth_staked_limit: number;
    limit_of_devices: number;
    pnl_events_limit: number;
    max_backup_size_mb: number;
    history_events_limit: number;
    reports_lookup_limit: number;
  };
  description: { label: string; value: string }[];
}

/** Price breakdown as returned by `POST /webapi/2/payment/breakdown`. */
export interface BreakdownWire {
  full_amount: string;
  final_amount: string;
  vat_rate: string;
  vat_amount: string;
  renewing_price: string;
  next_payment: number;
  discount: { is_valid: true; is_referral: boolean; discount_type: string; discount_amount: string; discounted_amount: string } | { is_valid: false; error: string } | null;
  credit: { available_amount: string; credited_amount: string } | null;
}

/** One asset entry of `GET /webapi/payment/crypto/options/`. */
export interface CryptoOptionWire {
  symbol: string;
  name: string;
  decimals?: number;
  address?: string;
  is_native_currency?: true;
}

/** Crypto payment request as returned by `POST /webapi/2/crypto/payments` and `POST /webapi/2/crypto/upgrade`. */
export interface CryptoPaymentWire {
  chain_id: number;
  chain_name: string;
  crypto_address: string;
  cryptocurrency: string;
  decimals: number;
  duration_in_months: number;
  final_price_in_crypto: number;
  final_price_in_eur: number;
  first_payment: boolean;
  hours_for_payment: number;
  months: number;
  number_of_months: number;
  start_date: number | null;
  subscription_id: string;
  token_address: string | null;
  transaction_started: boolean;
  vat: number;
}

/** Pending payment state as returned by `GET /webapi/2/crypto/payment/pending/`. */
export interface PendingPaymentWire {
  pending: boolean;
  transaction_started?: boolean;
  currency?: string;
  discount?: { code_name: string; discounted_amount_eur: string; discount_type: 'Fixed Amount' | 'Percentage' };
}

/** Pending upgrade state as returned by `GET /webapi/2/crypto/payment/upgrade/`. */
export interface UpgradePaymentWire extends PendingPaymentWire {
  from_plan: { id: number; tier: { id: number; name: string } };
  to_plan: { id: number; tier: { id: number; name: string } };
}

/** A logged-in account with a confirmed e-mail and no subscription, so it can buy. */
export function defaultAccount(): AccountWire {
  return {
    address: {
      address1: 'Test Street 1',
      address2: '',
      city: 'Berlin',
      company_name: '',
      country: 'DE',
      first_name: 'Test',
      last_name: 'User',
      moved_offline: false,
      postcode: '10115',
      vat_id: '',
    },
    api_key: '',
    api_secret: '',
    can_use_premium: false,
    date_now: new Date().toISOString(),
    email: 'test@example.com',
    email_confirmed: true,
    has_active_subscription: false,
    username: 'testuser',
    vat: 19,
    vat_id_status: 'Not checked',
  };
}

/** A logged-in account that already owns a subscription, so checkout runs as a renewal. */
export function subscriberAccount(): AccountWire {
  return { ...defaultAccount(), can_use_premium: true, has_active_subscription: true };
}

/** Id of the subscription the renewal specs renew. */
export const RENEWAL_SUBSCRIPTION_ID = 'sub-renewal-1';

/**
 * Builds a subscription entry of `GET /webapi/2/history/subscriptions`.
 *
 * @remarks
 * The defaults describe the Basic monthly plan paid with crypto. `actions` decides what the
 * subscription page offers and, through `canBuy`, whether checkout lets the user in at all; a
 * `Pending` status is what puts the subscription id in session storage for the pending-payment
 * middleware.
 */
export function subscriptionFor(overrides: Partial<SubscriptionWire> = {}): SubscriptionWire {
  return {
    actions: ['renew'],
    created_date: '2026-01-01T00:00:00+00:00',
    duration_in_months: 1,
    id: RENEWAL_SUBSCRIPTION_ID,
    is_active: true,
    is_legacy: false,
    next_action_date: '2026-02-01',
    next_billing_amount: 25,
    payment_method: 'crypto',
    payment_provider: 'crypto',
    plan_id: 3,
    plan_name: 'Basic',
    status: 'Cancelled but still active',
    ...overrides,
  };
}

/** A crypto subscription due for renewal, which is what `?id=` in checkout renews. */
export function renewableSubscription(overrides: Partial<SubscriptionWire> = {}): SubscriptionWire {
  return subscriptionFor(overrides);
}

/** A crypto subscription waiting for its payment; it is the one the pending-payment middleware resumes. */
export function pendingSubscription(overrides: Partial<SubscriptionWire> = {}): SubscriptionWire {
  return subscriptionFor({ pending: true, status: 'Pending', ...overrides });
}

/** Basic (plans 3 and 4) and Advanced (plans 1 and 2), matching the mock API server. */
export function defaultTiers(): AvailableTiersWire {
  return {
    settings: { country: 'DE', is_authenticated: true },
    tiers: [
      { monthly_plan: null, tier_name: 'Free', yearly_plan: null },
      { is_most_popular: true, monthly_plan: { plan_id: 3, price: '25.00' }, tier_name: 'Basic', yearly_plan: { plan_id: 4, price: '250.00' } },
      { monthly_plan: { plan_id: 1, price: '45.00' }, tier_name: 'Advanced', yearly_plan: { plan_id: 2, price: '450.00' } },
    ],
  };
}

/** Limits and descriptions of the Basic and Advanced plans, matching the mock API server. */
export function defaultTiersInfo(): TierInfoWire[] {
  return [
    {
      description: [
        { label: 'Historical events limit', value: '30K events' },
        { label: 'Encrypted data backups', value: 'Store up to 150MB' },
      ],
      limits: { eth_staked_limit: 128, history_events_limit: 30000, limit_of_devices: 2, max_backup_size_mb: 150, pnl_events_limit: 30000, reports_lookup_limit: 100 },
      monthly_plan: { id: 3, price: '25.00' },
      name: 'Basic',
      yearly_plan: { id: 4, price: '250.00' },
    },
    {
      description: [
        { label: 'Historical events limit', value: '100K events' },
        { label: 'Encrypted data backups', value: 'Store up to 600MB' },
      ],
      limits: { eth_staked_limit: 384, history_events_limit: 100000, limit_of_devices: 4, max_backup_size_mb: 600, pnl_events_limit: 100000, reports_lookup_limit: 300 },
      monthly_plan: { id: 1, price: '45.00' },
      name: 'Advanced',
      yearly_plan: { id: 2, price: '450.00' },
    },
  ];
}

/** A 25 EUR breakdown without discount or credit. */
export function defaultBreakdown(): BreakdownWire {
  return {
    credit: null,
    discount: null,
    final_amount: '25.00',
    full_amount: '25.00',
    next_payment: 0,
    renewing_price: '25.00',
    vat_amount: '3.99',
    vat_rate: '0.1900',
  };
}

/** Builds the crypto options response for the given assets, grouped by chain name like the backend. */
export function cryptoOptionsFor(assets: readonly PaymentAsset[]): Record<string, Record<string, CryptoOptionWire>> {
  const options: Record<string, Record<string, CryptoOptionWire>> = {};
  for (const asset of assets) {
    const entry: CryptoOptionWire = asset.address
      ? { address: asset.address, decimals: asset.decimals, name: asset.name, symbol: asset.symbol }
      : { decimals: asset.decimals, is_native_currency: true, name: asset.name, symbol: asset.symbol };
    options[asset.chainName] = { ...options[asset.chainName], [asset.identifier]: entry };
  }
  return options;
}

/** Builds the payment request the backend returns for paying a 25 EUR plan with `asset`. */
export function cryptoPaymentFor(asset: PaymentAsset, overrides: Partial<CryptoPaymentWire> = {}): CryptoPaymentWire {
  return {
    chain_id: asset.chainId,
    chain_name: asset.chainName,
    crypto_address: RECEIVING_ADDRESS,
    cryptocurrency: asset.identifier,
    decimals: asset.decimals,
    duration_in_months: 1,
    final_price_in_crypto: asset.address ? 25 : 0.01,
    final_price_in_eur: 25,
    first_payment: true,
    hours_for_payment: 24,
    months: 1,
    number_of_months: 1,
    start_date: null,
    subscription_id: 'sub-crypto-1',
    token_address: asset.address ?? null,
    transaction_started: false,
    vat: 19,
    ...overrides,
  };
}

/** A pending upgrade from Basic to Advanced. */
export function defaultUpgradePayment(): UpgradePaymentWire {
  return {
    from_plan: { id: 3, tier: { id: 2, name: 'Basic' } },
    pending: false,
    to_plan: { id: 1, tier: { id: 3, name: 'Advanced' } },
    transaction_started: false,
  };
}
