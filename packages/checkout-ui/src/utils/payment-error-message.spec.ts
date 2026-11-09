import { describe, expect, it } from 'vitest';
import { checkoutMessages } from '../messages/en';
import { paymentErrorMessage } from './payment-error-message';
import { createTranslator } from './translator';

const t = createTranslator(checkoutMessages);

describe('paymentErrorMessage', () => {
  it('shows a message that may be shown as it is', () => {
    expect(paymentErrorMessage(t, { kind: 'verbatim', message: 'Do Not Honor' })).toBe('Do Not Honor');
  });

  it('uses the same connectivity copy in both contexts', () => {
    const expected = 'We couldn\'t reach the payment provider. Check your connection and try again.';

    expect(paymentErrorMessage(t, { kind: 'network' })).toBe(expected);
    expect(paymentErrorMessage(t, { kind: 'network' }, 'card')).toBe(expected);
  });

  it('talks about the payment only when one was being made', () => {
    expect(paymentErrorMessage(t, { kind: 'unexpected' })).toContain('complete your payment');
    expect(paymentErrorMessage(t, { kind: 'unexpected' }, 'card')).toContain('process this card');
    expect(paymentErrorMessage(t, { kind: 'unexpected' }, 'card')).not.toContain('payment');
  });

  it('quotes the reference when there is one', () => {
    expect(paymentErrorMessage(t, { code: 'E42', kind: 'unexpected' })).toContain('reference E42');
    expect(paymentErrorMessage(t, { code: 'E42', kind: 'unexpected' }, 'card')).toContain('reference E42');
  });
});
