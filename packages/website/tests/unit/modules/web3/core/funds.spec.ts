import { describe, expect, it } from 'vitest';
import { computeFundsStatus } from '~/modules/web3/core/funds';

describe('web3 core/funds', () => {
  describe('computeFundsStatus — native payment', () => {
    const base = { estimatedGas: '0.001', isNative: true, nativeBalance: '1', price: '0.5', tokenBalance: '1' };

    it('is sufficient when the balance covers price and gas', () => {
      expect(computeFundsStatus(base)).toEqual({ gasShortfall: false, sufficient: true, tokenShortfall: false });
    });

    it('flags a hard token shortfall when balance is below the price', () => {
      const result = computeFundsStatus({ ...base, nativeBalance: '0.4' });
      expect(result).toEqual({ gasShortfall: false, sufficient: false, tokenShortfall: true });
    });

    it('flags only a soft gas shortfall when balance covers price but not price + gas', () => {
      // 0.5005 covers the 0.5 price but not 0.5 + 0.001 gas.
      const result = computeFundsStatus({ ...base, nativeBalance: '0.5005' });
      expect(result).toEqual({ gasShortfall: true, sufficient: false, tokenShortfall: false });
    });

    it('does not warn on gas when the price is already unaffordable', () => {
      // A token shortfall short-circuits the gas check (no double warning).
      const result = computeFundsStatus({ ...base, nativeBalance: '0.1' });
      expect(result.tokenShortfall).toBe(true);
      expect(result.gasShortfall).toBe(false);
    });

    it('treats an exact price balance as no token shortfall but a gas shortfall', () => {
      const result = computeFundsStatus({ ...base, nativeBalance: '0.5' });
      expect(result).toEqual({ gasShortfall: true, sufficient: false, tokenShortfall: false });
    });
  });

  describe('computeFundsStatus — erc20 payment', () => {
    const base = { estimatedGas: '0.002', isNative: false, nativeBalance: '0.1', price: '50', tokenBalance: '100' };

    it('is sufficient when the token balance covers price and native covers gas', () => {
      expect(computeFundsStatus(base)).toEqual({ gasShortfall: false, sufficient: true, tokenShortfall: false });
    });

    it('flags a hard token shortfall on insufficient ERC-20 balance', () => {
      const result = computeFundsStatus({ ...base, tokenBalance: '10' });
      expect(result).toEqual({ gasShortfall: false, sufficient: false, tokenShortfall: true });
    });

    it('flags a soft gas shortfall when native cannot cover gas even with enough tokens', () => {
      const result = computeFundsStatus({ ...base, nativeBalance: '0.001' });
      expect(result).toEqual({ gasShortfall: true, sufficient: false, tokenShortfall: false });
    });

    it('can flag both shortfalls at once', () => {
      const result = computeFundsStatus({ ...base, nativeBalance: '0', tokenBalance: '1' });
      expect(result).toEqual({ gasShortfall: true, sufficient: false, tokenShortfall: true });
    });
  });

  describe('computeFundsStatus — missing / loading data', () => {
    it('is neutral when the price is unknown', () => {
      const result = computeFundsStatus({ estimatedGas: '0.001', isNative: true, nativeBalance: '1', price: '', tokenBalance: '1' });
      expect(result).toEqual({ gasShortfall: false, sufficient: true, tokenShortfall: false });
    });

    it('is neutral when the native balance has not loaded (native payment)', () => {
      const result = computeFundsStatus({ estimatedGas: '0.001', isNative: true, nativeBalance: '', price: '0.5', tokenBalance: '' });
      expect(result.sufficient).toBe(true);
    });

    it('is neutral when the token balance has not loaded (erc20 payment)', () => {
      const result = computeFundsStatus({ estimatedGas: '0.002', isNative: false, nativeBalance: '0.1', price: '50', tokenBalance: '' });
      expect(result.sufficient).toBe(true);
    });

    it('does not warn on gas before the estimate has loaded', () => {
      const result = computeFundsStatus({ estimatedGas: '', isNative: false, nativeBalance: '0.1', price: '50', tokenBalance: '100' });
      expect(result.gasShortfall).toBe(false);
    });
  });
});
