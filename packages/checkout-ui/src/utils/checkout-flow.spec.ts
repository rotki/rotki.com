import { describe, expect, it } from 'vitest';
import { buildMethodLinks, checkoutSearch } from './checkout-flow';

describe('checkout-flow', () => {
  it('writes only the carried params that are set', () => {
    expect(checkoutSearch({ planId: 3, ref: 'FRIEND', discountCode: '', id: undefined })).toBe('?planId=3&ref=FRIEND');
    expect(checkoutSearch({})).toBe('');
  });

  it('links every method with the buyer\'s choices, and locks card and PayPal while Braintree is down', () => {
    expect(buildMethodLinks({ params: { planId: 3, discountCode: 'AUTUMN' }, braintreeUnavailable: true })).toEqual({
      card: { disabled: true, href: '/checkout/pay/card?planId=3&discountCode=AUTUMN' },
      crypto: { href: '/checkout/pay/request-crypto?planId=3&discountCode=AUTUMN' },
      paypal: { disabled: true, href: '/checkout/pay/paypal?planId=3&discountCode=AUTUMN' },
    });
  });

  it('offers a renewal only crypto', () => {
    expect(buildMethodLinks({ params: { planId: 3, id: 'sub-1' } })).toEqual({
      crypto: { href: '/checkout/pay/request-crypto?planId=3&id=sub-1' },
    });
  });

  it('prefixes the base, for the card app on its own origin', () => {
    expect(buildMethodLinks({ base: 'https://rotki.com', params: { planId: 3 } }).paypal?.href).toBe('https://rotki.com/checkout/pay/paypal?planId=3');
  });
});
