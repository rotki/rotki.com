import { assert, describe, expect, it } from 'vitest';

import { PaymentError } from '~/types/codes';
import { getErrorMessage, handlePaymentError } from '~/utils/api-error-handling';

import { createFetchError } from '../../utils';

// `getErrorMessage` only inspects `error.data` for 400s when `error.response` is
// also set, so attach a real Response to exercise that branch.
function fetchError400(data: unknown): ReturnType<typeof createFetchError> {
  const error = createFetchError(400, data);
  error.response = new Response(null, { status: 400 });
  return error;
}

describe('handlePaymentError', () => {
  it('should return error with parsed message for 400 status', () => {
    const fetchError = createFetchError(400, {
      message: 'Invalid discount code',
      result: false,
    });

    const result = handlePaymentError(fetchError);

    assert(result.isError);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error).message).toBe('Invalid discount code');
    expect(result.code).toBeUndefined();
  });

  it('should return UNVERIFIED code for 403 status', () => {
    const fetchError = createFetchError(403);

    const result = handlePaymentError(fetchError);

    assert(result.isError);
    expect(result.code).toBe(PaymentError.UNVERIFIED);
  });

  it('should return SERVER_ERROR code for 500 status', () => {
    const fetchError = createFetchError(500);

    const result = handlePaymentError(fetchError);

    assert(result.isError);
    expect(result.code).toBe(PaymentError.SERVER_ERROR);
    expect(result.error).toBeInstanceOf(Error);
  });

  it('should return SERVER_ERROR code for 502 status', () => {
    const fetchError = createFetchError(502);

    const result = handlePaymentError(fetchError);

    assert(result.isError);
    expect(result.code).toBe(PaymentError.SERVER_ERROR);
  });

  it('should return SERVER_ERROR code for 503 status', () => {
    const fetchError = createFetchError(503);

    const result = handlePaymentError(fetchError);

    assert(result.isError);
    expect(result.code).toBe(PaymentError.SERVER_ERROR);
  });

  it('should return no code for non-FetchError', () => {
    const error = new Error('Something went wrong');

    const result = handlePaymentError(error);

    assert(result.isError);
    expect(result.code).toBeUndefined();
    expect(result.error).toBe(error);
  });
});

describe('getErrorMessage', () => {
  it('returns the message of a plain Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to a generic message when none is present', () => {
    expect(getErrorMessage({})).toBe('An unknown error occurred');
  });

  it('uses the parsed ActionResult message for a 400 with response', () => {
    expect(getErrorMessage(fetchError400({ message: 'parsed message', result: false }))).toBe('parsed message');
  });

  it('returns "Unknown error" when the parsed 400 body has no message', () => {
    expect(getErrorMessage(fetchError400({ result: false }))).toBe('Unknown error');
  });

  it('falls back to raw data.message when the 400 body fails schema parsing', () => {
    // `result` is not a boolean, so the schema parse fails and the raw message is used.
    expect(getErrorMessage(fetchError400({ message: 'raw message', result: 'not-a-boolean' }))).toBe('raw message');
  });

  it('falls back to error.message when an unparsable 400 body has no message', () => {
    const error = fetchError400({ result: 'not-a-boolean' });
    expect(getErrorMessage(error)).toBe(error.message);
  });

  it('uses error.message for a 400 without a response object', () => {
    const error = createFetchError(400, { message: 'ignored without response' });
    expect(getErrorMessage(error)).toBe(error.message);
  });

  it('uses error.message for non-400 FetchErrors', () => {
    const error = createFetchError(500, { message: 'ignored for 500' });
    expect(getErrorMessage(error)).toBe(error.message);
  });
});
