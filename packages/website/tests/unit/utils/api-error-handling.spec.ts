import { describe, expect, it } from 'vitest';

import { getErrorMessage, parseJsonBody, UnreadableResponseError } from '~/utils/api-error-handling';

import { createFetchError } from '../../utils';

/**
 * `getErrorMessage` only inspects `error.data` for 400s when `error.response` is
 * also set, so this attaches a real Response to exercise that branch.
 */
function fetchError400(data: unknown): ReturnType<typeof createFetchError> {
  const error = createFetchError(400, data);
  error.response = new Response(null, { status: 400 });
  return error;
}

describe('parseJsonBody', () => {
  it('parses JSON', () => {
    expect(parseJsonBody('{"result":true}')).toEqual({ result: true });
  });

  it('fails with readable copy and keeps the parser error as the cause', () => {
    let failure: unknown;
    try {
      parseJsonBody('MultipleObjectsReturned at /webapi/2/crypto/payments');
    }
    catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(UnreadableResponseError);
    expect(failure).toHaveProperty('message', 'Something went wrong on our side. Please try again.');
    expect(failure).toHaveProperty('cause', expect.any(SyntaxError));
  });
});

describe('getErrorMessage', () => {
  it('returns readable copy for a body that is not JSON', () => {
    expect(getErrorMessage(new UnreadableResponseError())).toBe('Something went wrong on our side. Please try again.');
  });

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

  it('falls back to raw data.message when the 400 body fails schema parsing (non-boolean result)', () => {
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
