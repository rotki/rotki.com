import type { PaymentBreakdownResponse, SelectedPlan } from '../schemas/plans';
import { DiscountType } from '../schemas/discount';
import { formatEur, formatPercent, fromCents, toCents } from './money';

/** An EUR amount together with its display string. */
export interface MoneyValue {
  readonly amount: number;
  readonly formatted: string;
}

export interface OrderSummaryDiscount {
  /** Amount the discount takes off the order. */
  readonly saved: MoneyValue;
  readonly isReferral: boolean;
  /** Formatted percentage ("10%") for percentage discounts, undefined otherwise. */
  readonly percent?: string;
}

export interface OrderSummaryVat {
  /** Rate in percent (19 means 19%); 0 when no VAT applies. */
  readonly rate: number;
  readonly formattedRate: string;
  readonly amount: MoneyValue;
}

/**
 * Everything the checkout shows about the price of an order, in display order. Amounts include
 * VAT, so the rows read top to bottom: subtotal, minus discount, minus credit, is what is due.
 */
export interface OrderSummary {
  /** The plan price, or for an upgrade the prorated charge, before discount and credit. */
  readonly subtotal: MoneyValue;
  /** Whether the subtotal is an upgrade's prorated charge. */
  readonly prorated: boolean;
  /** Present when the breakdown confirms a valid discount or referral code. */
  readonly discount?: OrderSummaryDiscount;
  /** Present when account credit lowers the charge. */
  readonly credit?: MoneyValue;
  /** The VAT contained in the amount due, for information; absent when no VAT applies. */
  readonly vat?: OrderSummaryVat;
  /** Total charged today. */
  readonly dueToday: MoneyValue;
  /** Amount of each renewal after this payment. */
  readonly renewal: MoneyValue;
}

export interface OrderSummaryInput {
  plan: Pick<SelectedPlan, 'price'>;
  /** Payment breakdown from the API; without it the summary falls back to the plan price. */
  breakdown?: PaymentBreakdownResponse;
  upgrade?: boolean;
}

function money(value: number | string): MoneyValue {
  const cents = toCents(value);
  return { amount: fromCents(cents), formatted: formatEur(value) };
}

function moneyFromCents(cents: number): MoneyValue {
  const amount = fromCents(cents);
  return { amount, formatted: formatEur(amount) };
}

/**
 * Converts the API's VAT rate to percent. The API sends either a fraction ("0.19") or a
 * percentage ("19"); anything that is not a positive number means no VAT.
 */
export function vatRatePercent(rate: number | string): number {
  const value = typeof rate === 'number' ? rate : Number.parseFloat(rate);
  if (!Number.isFinite(value) || value <= 0)
    return 0;
  const percent = value < 1 ? value * 100 : value;
  // Round to hundredths of a percent to drop binary noise such as 7.000000000000001.
  return fromCents(toCents(percent));
}

/**
 * Summarises a discount or referral code the breakdown confirmed: what it saves and, for
 * percentage codes, the percentage. Undefined for a missing or rejected code.
 */
export function buildDiscountSummary(discount: PaymentBreakdownResponse['discount'] | undefined): OrderSummaryDiscount | undefined {
  if (!discount?.isValid)
    return undefined;
  const isPercentage = discount.discountType.includes(DiscountType.PERCENTAGE);
  return {
    saved: money(discount.discountedAmount),
    isReferral: discount.isReferral,
    percent: isPercentage && discount.discountAmount ? formatPercent(discount.discountAmount) : undefined,
  };
}

function buildCredit({ credit }: PaymentBreakdownResponse): MoneyValue | undefined {
  if (!credit)
    return undefined;
  const cents = toCents(credit.creditedAmount);
  if (Number.isNaN(cents) || cents <= 0)
    return undefined;
  return moneyFromCents(cents);
}

function buildVat(rate: number, vatCents: number): OrderSummaryVat {
  return { rate, formattedRate: formatPercent(rate), amount: moneyFromCents(vatCents) };
}

/** Summary shown before the breakdown has loaded: the plan price, without VAT. */
function buildPlanOnlySummary(price: number): OrderSummary {
  const planPrice = money(price);
  return {
    subtotal: planPrice,
    prorated: false,
    dueToday: planPrice,
    renewal: planPrice,
  };
}

/**
 * Builds the order summary both checkouts render from the payment breakdown. It only
 * arranges the numbers the API already computed: the API takes the discount and then the
 * credit off the full amount, so the rows add up to the amount due without any maths here.
 */
export function buildOrderSummary({ plan, breakdown, upgrade = false }: OrderSummaryInput): OrderSummary {
  if (!breakdown)
    return buildPlanOnlySummary(plan.price);

  const rate = vatRatePercent(breakdown.vatRate);

  return {
    subtotal: money(breakdown.fullAmount),
    prorated: upgrade,
    discount: buildDiscountSummary(breakdown.discount),
    credit: buildCredit(breakdown),
    vat: rate > 0 ? buildVat(rate, toCents(breakdown.vatAmount)) : undefined,
    dueToday: money(breakdown.finalAmount),
    renewal: money(breakdown.renewingPrice),
  };
}
