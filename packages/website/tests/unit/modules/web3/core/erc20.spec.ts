import { describe, expect, it } from 'vitest';
import { ERC20_ABI, isNativeToken, NATIVE_TOKEN_ADDRESS } from '~/modules/web3/core/erc20';

describe('web3 core/erc20', () => {
  describe('isNativeToken', () => {
    it('treats missing addresses as native', () => {
      expect(isNativeToken(undefined)).toBe(true);
      expect(isNativeToken(null)).toBe(true);
      expect(isNativeToken('')).toBe(true);
    });

    it('treats the zero-address sentinel as native (case-insensitive)', () => {
      expect(isNativeToken(NATIVE_TOKEN_ADDRESS)).toBe(true);
      expect(isNativeToken('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('treats a real token address as non-native', () => {
      expect(isNativeToken('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')).toBe(false);
    });
  });

  describe('the erc20 abi', () => {
    it('exposes the functions the actions layer relies on', () => {
      const names = ERC20_ABI.filter(item => item.type === 'function').map(item => item.name);
      expect(names).toEqual(expect.arrayContaining(['allowance', 'approve', 'transfer', 'balanceOf', 'decimals']));
    });
  });
});
