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

/** Everything the checkout shows about the price of an order, in display order. */
export interface OrderSummary {
  /** Plan price line: the breakdown's full amount for a new subscription, the plan list price for an upgrade. */
  readonly price: MoneyValue;
  /** Upgrades only: the prorated charge before discount and credit. */
  readonly proratedPrice?: MoneyValue;
  /** Price before discount and credit ("Original price"). */
  readonly fullAmount: MoneyValue;
  /** Present when the breakdown confirms a valid discount or referral code. */
  readonly discount?: OrderSummaryDiscount;
  /** Present when account credit lowers the charge. */
  readonly credit?: MoneyValue;
  /** Net amount charged today, before VAT. */
  readonly subtotal: MoneyValue;
  readonly vat: OrderSummaryVat;
  /** Total charged today, VAT included. */
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
    price: planPrice,
    fullAmount: planPrice,
    subtotal: planPrice,
    vat: buildVat(0, 0),
    dueToday: planPrice,
    renewal: planPrice,
  };
}

/**
 * Builds the order summary both checkouts render from the payment breakdown. It only
 * centralises the numbers the API already computed; the one derived value is the net
 * subtotal (total minus VAT), done in cents.
 */
export function buildOrderSummary({ plan, breakdown, upgrade = false }: OrderSummaryInput): OrderSummary {
  if (!breakdown)
    return buildPlanOnlySummary(plan.price);

  const dueToday = money(breakdown.finalAmount);
  const rate = vatRatePercent(breakdown.vatRate);
  const vatCents = rate > 0 ? toCents(breakdown.vatAmount) : 0;
  const fullAmount = money(breakdown.fullAmount);

  return {
    price: upgrade ? money(plan.price) : fullAmount,
    proratedPrice: upgrade ? fullAmount : undefined,
    fullAmount,
    discount: buildDiscountSummary(breakdown.discount),
    credit: buildCredit(breakdown),
    subtotal: rate > 0 ? moneyFromCents(toCents(dueToday.amount) - vatCents) : dueToday,
    vat: buildVat(rate, vatCents),
    dueToday,
    renewal: money(breakdown.renewingPrice),
  };
}
