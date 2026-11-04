import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { buildDiscountSummary, type OrderSummaryDiscount } from '@rotki/card-payment-common/utils/order-summary';
import { get, set } from '@vueuse/shared';
import { computed, type ComputedRef, type MaybeRefOrGetter, type Ref, ref, toValue, watch } from 'vue';

type BreakdownDiscount = PaymentBreakdownResponse['discount'];

export interface UseDiscountCodeReturn {
  /** Text in the field, bound with v-model; it becomes the code on `apply`. */
  modelInput: Ref<string>;
  /** The code the breakdown confirmed, with what it saves. */
  applied: ComputedRef<OrderSummaryDiscount | undefined>;
  /** Why the breakdown rejected the code, while the field still shows that code. */
  error: ComputedRef<string | undefined>;
  canApply: ComputedRef<boolean>;
  /** Makes the trimmed field text the code and returns it. */
  apply: () => string;
  /** Clears the field and the code. */
  remove: () => void;
}

/**
 * State of the discount code field. `code` is the code the checkout prices with (the
 * component's v-model); `discount` is what the latest breakdown said about it. A rejection
 * shows only while the field still holds the rejected code, so typing hides it without
 * clearing the code and fetching a new breakdown.
 */
export function useDiscountCode(code: Ref<string>, discount: MaybeRefOrGetter<BreakdownDiscount | undefined>): UseDiscountCodeReturn {
  const modelInput = ref<string>(get(code));
  // The code the current discount info answers. A newly applied code shows no verdict until its own answer arrives.
  const answeredCode = ref<string>(get(code));

  const applied = computed<OrderSummaryDiscount | undefined>(() =>
    get(code) ? buildDiscountSummary(toValue(discount)) : undefined);

  const error = computed<string | undefined>(() => {
    const info = toValue(discount);
    if (!info || info.isValid || !get(code) || get(answeredCode) !== get(code))
      return undefined;
    return get(modelInput).trim() === get(code) ? info.error : undefined;
  });

  const canApply = computed<boolean>(() => get(modelInput).trim().length > 0);

  function apply(): string {
    const value = get(modelInput).trim();
    set(code, value);
    return value;
  }

  function remove(): void {
    set(modelInput, '');
    set(code, '');
  }

  watch(code, (value: string) => {
    set(modelInput, value);
  });

  watch(() => toValue(discount), () => {
    set(answeredCode, get(code));
  });

  return { applied, apply, canApply, error, modelInput, remove };
}
