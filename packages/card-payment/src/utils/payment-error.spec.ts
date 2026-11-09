import { PaymentUserError } from '@rotki/sigil';
import { describe, expect, it } from 'vitest';
import { userPaymentMessage } from './payment-error';

describe('utils/payment-error', () => {
  it('shows copy written for the buyer as it is', () => {
    expect(userPaymentMessage(new PaymentUserError('Your card was declined.'))).toBe('Your card was declined.');
  });

  it('never shows the SDK\'s own message for an unexpected error', () => {
    expect(userPaymentMessage(new Error('TypeError: x is undefined'))).toBe('We couldn\'t complete your payment. Please try again, or contact support if it keeps happening.');
  });

  it('says nothing was charged while a card is being saved', () => {
    expect(userPaymentMessage(new Error('boom'), 'card')).toContain('We couldn\'t process this card.');
  });
});
