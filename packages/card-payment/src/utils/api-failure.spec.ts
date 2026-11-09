import { parseBraintreeError, PaymentUserError } from '@rotki/sigil';
import { err, ok } from 'plainfp/result';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attempt, failed, isCardAdded, toPaymentError, userFacing } from './api-failure';

describe('utils/api-failure', () => {
  describe('toPaymentError', () => {
    it('lets copy for the buyer through, and keeps the detail for the logs', () => {
      const error = toPaymentError(userFacing('Try another card', 'processor declined 2046', false));

      expect(error).toBeInstanceOf(PaymentUserError);
      expect(parseBraintreeError(error)).toMatchObject({ message: 'Try another card', logMessage: expect.stringContaining('processor declined 2046') });
    });

    it('keeps any other failure from reading as copy for the buyer', () => {
      const error = toPaymentError(failed('HTTP 500: gateway dump'));

      expect(error).not.toBeInstanceOf(PaymentUserError);
      expect(error.message).toBe('HTTP 500: gateway dump');
    });
  });

  it.each([
    ['a vaulted card', userFacing('Copy', 'detail', true), true],
    ['copy without a vaulted card', userFacing('Copy', 'detail', false), false],
    ['any other failure', failed('boom'), false],
  ])('isCardAdded reads %s', (_, failure, expected) => {
    expect(isCardAdded(failure)).toBe(expected);
  });

  describe('attempt', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('passes a success through without logging', async () => {
      await expect(attempt('Failed to load', async () => ok(1))).resolves.toEqual(ok(1));

      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs a failure under the label', async () => {
      const failure = failed('boom');

      await expect(attempt('Failed to load', async () => err(failure))).resolves.toEqual(err(failure));

      expect(console.error).toHaveBeenCalledExactlyOnceWith('Failed to load:', failure);
    });

    it('turns what the request throws into a failure', async () => {
      await expect(attempt('Failed to load', async () => {
        throw new TypeError('Failed to fetch');
      })).resolves.toEqual(err(failed('Failed to fetch')));
    });

    it('falls back to the label when what it throws is not an error', async () => {
      await expect(attempt('Failed to load', vi.fn().mockRejectedValue('offline'))).resolves.toEqual(err(failed('Failed to load')));
    });
  });
});
