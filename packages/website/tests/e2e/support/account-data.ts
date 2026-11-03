/* Wire data for the account pages: devices, billing history and cancellation reasons. */

/** Device as returned by `GET /webapi/2/devices/`. */
export interface DeviceWire {
  created_at: string;
  id: number;
  label: string;
  last_seen_at: string;
  platform: string;
  unique_id: string;
  user: string;
}

/** A desktop app that last synced `minutesAgo` minutes before now. */
export function deviceFor(id: number, label: string, minutesAgo: number, platform = 'linux'): DeviceWire {
  return {
    created_at: '2026-01-01T10:00:00Z',
    id,
    label,
    last_seen_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    platform,
    unique_id: `device-${id}`,
    user: 'testuser',
  };
}

/** Payment as returned by `GET /webapi/2/history/payments/`. */
export interface PaymentWire {
  duration_in_months: number;
  eur_amount: number;
  identifier: string;
  is_refund: boolean;
  is_upgrade: boolean;
  legacy: boolean;
  original_plan: string | null;
  paid_at: string;
  paid_using: string;
  plan: string;
  referral_credit_applied_eur: number;
}

/** A Basic monthly card payment; override what the test is about. */
export function paymentFor(overrides: Partial<PaymentWire> = {}): PaymentWire {
  return {
    duration_in_months: 1,
    eur_amount: 25,
    identifier: 'payment-1',
    is_refund: false,
    is_upgrade: false,
    legacy: false,
    original_plan: null,
    paid_at: '2026-09-01T10:00:00+00:00',
    paid_using: 'CREDIT_CARD',
    plan: 'basic',
    referral_credit_applied_eur: 0,
    ...overrides,
  };
}

/** Reasons `GET /webapi/2/subscriptions/cancellation-feedback` offers when cancelling. */
export function cancellationReasons(): { reasons: { value: number; label: string }[] } {
  return { reasons: [{ label: 'Too expensive', value: 1 }, { label: 'Other', value: 2 }] };
}

/** Saved card as returned by `GET /webapi/payment/btr/cards/`. */
export interface CardWire {
  expires_at: string;
  image_url: string;
  last4: string;
  linked: boolean;
  token: string;
}

/** A saved card; `linked` makes it the one that pays for renewals. */
export function cardFor(last4: string, linked = false): CardWire {
  return {
    expires_at: '08/2028',
    image_url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    last4,
    linked,
    token: `card-${last4}`,
  };
}

/** Credit balance and history as returned by `GET /webapi/2/credit/`. */
export interface CreditWire {
  balance_eur: string;
  history: {
    amount_eur: string;
    balance_after_eur: string;
    created_at: string;
    entry_type: string;
    notes: string;
  }[];
}

/** 12.50 € from two referrals with 7.50 € spent on a renewal in between. */
export function creditWithHistory(): CreditWire {
  return {
    balance_eur: '12.50',
    history: [
      { amount_eur: '10.00', balance_after_eur: '10.00', created_at: '2026-01-10T10:00:00Z', entry_type: 'referral_reward', notes: 'Referral bonus' },
      { amount_eur: '-7.50', balance_after_eur: '2.50', created_at: '2026-02-02T10:00:00Z', entry_type: 'payment', notes: 'Applied to Basic' },
      { amount_eur: '10.00', balance_after_eur: '12.50', created_at: '2026-03-01T10:00:00Z', entry_type: 'referral_reward', notes: '' },
    ],
  };
}
