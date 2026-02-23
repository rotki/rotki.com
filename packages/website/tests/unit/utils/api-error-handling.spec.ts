import { FetchError } from 'ofetch';
import { describe, expect, it } from 'vitest';
import { PaymentError } from '~/types/codes';
import { handlePaymentError } from '~/utils/api-error-handling';

function createFetchError(status: number, data?: any): FetchError {
  const error = new FetchError(`Request failed with status ${status}`);
  error.status = status;
  error.statusCode = status;
  error.data = data;
  return error;
}

describe('handlePaymentError', () => {
  it('should return error with parsed message for 400 status', () => {
    const fetchError = createFetchError(400, {
      message: 'Invalid discount code',
      result: false,
    });

    const result = handlePaymentError(fetchError);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error).message).toBe('Invalid discount code');
      expect(result.code).toBeUndefined();
    }
  });

  it('should return UNVERIFIED code for 403 status', () => {
    const fetchError = createFetchError(403);

    const result = handlePaymentError(fetchError);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.code).toBe(PaymentError.UNVERIFIED);
    }
  });

  it('should return SERVER_ERROR code for 500 status', () => {
    const fetchError = createFetchError(500);

    const result = handlePaymentError(fetchError);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.code).toBe(PaymentError.SERVER_ERROR);
      expect(result.error).toBeInstanceOf(Error);
    }
  });

  it('should return SERVER_ERROR code for 502 status', () => {
    const fetchError = createFetchError(502);

    const result = handlePaymentError(fetchError);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.code).toBe(PaymentError.SERVER_ERROR);
    }
  });

  it('should return SERVER_ERROR code for 503 status', () => {
    const fetchError = createFetchError(503);

    const result = handlePaymentError(fetchError);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.code).toBe(PaymentError.SERVER_ERROR);
    }
  });

  it('should return no code for non-FetchError', () => {
    const error = new Error('Something went wrong');

    const result = handlePaymentError(error);

    expect(result.isError).toBe(true);
    if (result.isError) {
      expect(result.code).toBeUndefined();
      expect(result.error).toBe(error);
    }
  });
});
