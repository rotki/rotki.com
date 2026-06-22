import { classifyCryptoTxError } from '@rotki/sigil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fromCause,
  insufficientFunds,
  messageOf,
  notConnected,
  noWallet,
  timeout,
  userRejected,
  validation,
  web3ErrorKey,
  wrongChain,
} from '~/modules/web3/core/errors';

vi.mock('@rotki/sigil', async importOriginal => ({
  ...await importOriginal<typeof import('@rotki/sigil')>(),
  classifyCryptoTxError: vi.fn(() => undefined),
}));

describe('web3 core/errors', () => {
  beforeEach(() => {
    vi.mocked(classifyCryptoTxError).mockReturnValue('CHECKOUT_ERROR');
  });

  describe('messageOf', () => {
    it('prefers shortMessage over message', () => {
      expect(messageOf({ message: 'long', shortMessage: 'short' })).toBe('short');
    });

    it('falls back to message', () => {
      expect(messageOf({ message: 'just message' })).toBe('just message');
    });

    it('handles raw strings', () => {
      expect(messageOf('boom')).toBe('boom');
    });

    it('returns a default for unknown shapes', () => {
      expect(messageOf(42)).toBe('Unknown error');
      expect(messageOf(null)).toBe('Unknown error');
    });
  });

  describe('constructors', () => {
    it('tag each error correctly', () => {
      expect(noWallet()._tag).toBe('NoWallet');
      expect(notConnected()._tag).toBe('NotConnected');
      expect(userRejected()._tag).toBe('UserRejected');
      expect(insufficientFunds()._tag).toBe('InsufficientFunds');
      expect(timeout()._tag).toBe('Timeout');
      expect(validation('x')._tag).toBe('Validation');
    });

    it('wrongChain carries expected/actual and a default message', () => {
      const error = wrongChain(1, 137);
      expect(error).toMatchObject({ _tag: 'WrongChain', actual: 137, expected: 1 });
      expect(error.message).toContain('1');
      expect(error.message).toContain('137');
    });

    it('wrongChain reports none when actual is undefined', () => {
      expect(wrongChain(1, undefined).message).toContain('none');
    });
  });

  describe('web3ErrorKey', () => {
    it('namespaces the tag', () => {
      expect(web3ErrorKey(userRejected())).toBe('web3_errors.UserRejected');
      expect(web3ErrorKey(validation('x'))).toBe('web3_errors.Validation');
    });
  });

  describe('fromCause', () => {
    it('maps user rejection regardless of fallback', () => {
      vi.mocked(classifyCryptoTxError).mockReturnValue('CRYPTO_USER_REJECTED');
      const error = fromCause(new Error('nope'), 'TxFailed');
      expect(error._tag).toBe('UserRejected');
      expect(error.cause).toBeInstanceOf(Error);
    });

    it('maps insufficient funds', () => {
      vi.mocked(classifyCryptoTxError).mockReturnValue('CRYPTO_INSUFFICIENT_FUNDS');
      expect(fromCause(new Error('broke'))._tag).toBe('InsufficientFunds');
    });

    it('uses the provided fallback tag for generic causes', () => {
      vi.mocked(classifyCryptoTxError).mockReturnValue('CHECKOUT_ERROR');
      expect(fromCause(new Error('x'), 'SignFailed')._tag).toBe('SignFailed');
      expect(fromCause(new Error('x'), 'ConnectFailed')._tag).toBe('ConnectFailed');
    });

    it('defaults the fallback to TxFailed', () => {
      expect(fromCause(new Error('x'))._tag).toBe('TxFailed');
    });

    it('extracts the message from the cause', () => {
      expect(fromCause({ shortMessage: 'reverted' }).message).toBe('reverted');
    });
  });
});
