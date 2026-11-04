import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { get, set } from '@vueuse/shared';
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useDiscountCode } from './discount-code';

type BreakdownDiscount = PaymentBreakdownResponse['discount'];

const referral: BreakdownDiscount = {
  discountAmount: '10',
  discountType: DiscountType.PERCENTAGE,
  discountedAmount: '2.50',
  isReferral: true,
  isValid: true,
};

const rejected: BreakdownDiscount = { error: 'This code has expired', isValid: false };

describe('useDiscountCode', () => {
  it('starts the field with the current code', () => {
    const { modelInput } = useDiscountCode(ref<string>('DGXXOU'), undefined);

    expect(get(modelInput)).toBe('DGXXOU');
  });

  it('applies the trimmed field text as the code', () => {
    const code = ref<string>('');
    const { apply, canApply, modelInput } = useDiscountCode(code, undefined);

    expect(get(canApply)).toBe(false);
    set(modelInput, '  SUMMER  ');
    expect(get(canApply)).toBe(true);

    expect(apply()).toBe('SUMMER');
    expect(get(code)).toBe('SUMMER');
  });

  it('describes a confirmed code with its saving and percentage', () => {
    const { applied } = useDiscountCode(ref<string>('DGXXOU'), referral);

    expect(get(applied)).toEqual({ isReferral: true, percent: '10%', saved: { amount: 2.5, formatted: '2.50 €' } });
  });

  it('ignores a stale confirmation once the code is gone', () => {
    const { applied } = useDiscountCode(ref<string>(''), referral);

    expect(get(applied)).toBeUndefined();
  });

  it('shows a rejection only while the field holds the rejected code', async () => {
    const code = ref<string>('OLD');
    const discount = ref<BreakdownDiscount>(rejected);
    const { applied, error, modelInput } = useDiscountCode(code, discount);

    expect(get(applied)).toBeUndefined();
    expect(get(error)).toBe('This code has expired');

    set(modelInput, 'OLDE');
    expect(get(error)).toBeUndefined();
    expect(get(code)).toBe('OLD');

    set(modelInput, 'OLD');
    await nextTick();
    expect(get(error)).toBe('This code has expired');
  });

  it('keeps an earlier rejection off a newly applied code until its answer arrives', async () => {
    const code = ref<string>('OLD');
    const discount = ref<BreakdownDiscount>(rejected);
    const { apply, error, modelInput } = useDiscountCode(code, discount);

    set(modelInput, 'NEW');
    apply();
    await nextTick();
    expect(get(error)).toBeUndefined();

    set(discount, { error: 'Unknown code', isValid: false });
    await nextTick();
    expect(get(error)).toBe('Unknown code');
  });

  it('removes the code and empties the field', () => {
    const code = ref<string>('DGXXOU');
    const { modelInput, remove } = useDiscountCode(code, referral);

    remove();

    expect(get(code)).toBe('');
    expect(get(modelInput)).toBe('');
  });

  it('follows the code when the checkout changes it', async () => {
    const code = ref<string>('');
    const { modelInput } = useDiscountCode(code, undefined);

    set(code, 'CAMPAIGN');
    await nextTick();

    expect(get(modelInput)).toBe('CAMPAIGN');
  });
});
