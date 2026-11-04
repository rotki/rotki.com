import { afterEach, describe, expect, it } from 'vitest';
import { checkoutMethodLinks, getUrlParam, withCheckoutParams } from './navigation';

function setSearch(search: string): void {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

describe('utils/navigation', () => {
  afterEach(() => {
    setSearch('');
  });

  describe('getUrlParam', () => {
    it('returns the query value', () => {
      setSearch('?planId=42');
      expect(getUrlParam('planId')).toBe('42');
    });

    it('falls back to the default value, then to null', () => {
      expect(getUrlParam('planId', 'fallback')).toBe('fallback');
      expect(getUrlParam('planId')).toBeNull();
    });
  });

  describe('withCheckoutParams', () => {
    it('carries the plan, referral, discount code and renewal id over', () => {
      setSearch('?planId=3&ref=DGXXOU&discountCode=AUTUMN&id=sub-1&upgradeSubId=9&extra=x');
      expect(withCheckoutParams('https://rotki.com/checkout/pay/paypal'))
        .toBe('https://rotki.com/checkout/pay/paypal?planId=3&ref=DGXXOU&discountCode=AUTUMN&id=sub-1');
    });

    it('skips missing and empty params', () => {
      setSearch('?planId=3&ref=');
      expect(withCheckoutParams('/checkout/pay')).toBe('/checkout/pay?planId=3');
      setSearch('');
      expect(withCheckoutParams('/checkout/pay')).toBe('/checkout/pay');
    });
  });

  describe('checkoutMethodLinks', () => {
    it('links card to this app and PayPal and crypto to the website, with the checkout params', () => {
      setSearch('?planId=3&ref=DGXXOU');
      const host = `${window.location.protocol}//${window.location.host}`;

      expect(checkoutMethodLinks()).toEqual({
        card: { disabled: false, href: `${host}/checkout/pay/card?planId=3&ref=DGXXOU` },
        crypto: { href: `${host}/checkout/pay/request-crypto?planId=3&ref=DGXXOU` },
        paypal: { disabled: false, href: `${host}/checkout/pay/paypal?planId=3&ref=DGXXOU` },
      });
    });
  });
});
