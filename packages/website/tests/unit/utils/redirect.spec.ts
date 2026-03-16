import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSafeRedirectUrl } from '~/utils/redirect';

describe('getSafeRedirectUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://rotki.com',
        hostname: 'rotki.com',
      },
    });
  });

  describe('relative paths', () => {
    it('should allow simple relative paths', () => {
      expect(getSafeRedirectUrl('/home/subscription')).toBe('/home/subscription');
    });

    it('should allow relative paths with query params', () => {
      expect(getSafeRedirectUrl('/checkout/pay/method?planId=1')).toBe('/checkout/pay/method?planId=1');
    });

    it('should allow encoded relative paths', () => {
      expect(getSafeRedirectUrl(encodeURIComponent('/checkout/pay/card?planId=2'))).toBe('/checkout/pay/card?planId=2');
    });

    it('should reject protocol-relative URLs (//)', () => {
      expect(getSafeRedirectUrl('//evil.com/path')).toBe('/home/subscription');
    });
  });

  describe('same-origin URLs', () => {
    it('should allow exact same-origin URLs', () => {
      expect(getSafeRedirectUrl('https://rotki.com/checkout')).toBe('https://rotki.com/checkout');
    });

    it('should allow encoded same-origin URLs', () => {
      expect(getSafeRedirectUrl(encodeURIComponent('https://rotki.com/checkout'))).toBe('https://rotki.com/checkout');
    });
  });

  describe('subdomain URLs', () => {
    it('should allow subdomains of the same root domain', () => {
      expect(getSafeRedirectUrl('https://app.rotki.com/home')).toBe('https://app.rotki.com/home');
    });

    it('should allow deeper subdomains', () => {
      expect(getSafeRedirectUrl('https://staging.app.rotki.com/home')).toBe('https://staging.app.rotki.com/home');
    });

    it('should allow subdomains when current host is a subdomain', () => {
      vi.stubGlobal('window', {
        location: {
          origin: 'https://app.rotki.com',
          hostname: 'app.rotki.com',
        },
      });
      expect(getSafeRedirectUrl('https://rotki.com/home')).toBe('https://rotki.com/home');
    });
  });

  describe('external URLs (blocked)', () => {
    it('should reject completely different domains', () => {
      expect(getSafeRedirectUrl('https://evil.com/phishing')).toBe('/home/subscription');
    });

    it('should reject domains that look similar', () => {
      expect(getSafeRedirectUrl('https://rotki.com.evil.com/phishing')).toBe('/home/subscription');
    });

    it('should reject encoded external URLs', () => {
      expect(getSafeRedirectUrl(encodeURIComponent('https://evil.com/steal'))).toBe('/home/subscription');
    });

    it('should reject domains sharing a suffix but different root', () => {
      expect(getSafeRedirectUrl('https://notrotki.com/path')).toBe('/home/subscription');
    });
  });

  describe('dangerous protocols', () => {
    it.each([
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox',
    ])('should reject %s', (url) => {
      expect(getSafeRedirectUrl(url)).toBe('/home/subscription');
    });

    it('should reject encoded javascript protocol', () => {
      expect(getSafeRedirectUrl(encodeURIComponent('javascript:alert(1)'))).toBe('/home/subscription');
    });
  });

  describe('custom fallback', () => {
    it('should use the provided fallback for rejected URLs', () => {
      expect(getSafeRedirectUrl('https://evil.com', '/login')).toBe('/login');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(getSafeRedirectUrl('')).toBe('/home/subscription');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(getSafeRedirectUrl('ht tp://invalid url')).toBe('/home/subscription');
    });

    it('should reject URL with credentials', () => {
      expect(getSafeRedirectUrl('https://user:pass@evil.com')).toBe('/home/subscription');
    });
  });

  describe('localhost development', () => {
    beforeEach(() => {
      vi.stubGlobal('window', {
        location: {
          origin: 'http://localhost:3000',
          hostname: 'localhost',
        },
      });
    });

    it('should allow same localhost URLs', () => {
      expect(getSafeRedirectUrl('http://localhost:3000/home')).toBe('http://localhost:3000/home');
    });

    it('should reject external URLs from localhost', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBe('/home/subscription');
    });
  });
});
