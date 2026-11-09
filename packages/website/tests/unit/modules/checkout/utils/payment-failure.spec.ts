import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { describe, expect, it } from 'vitest';
import {
  isOutcomeUnknown,
  parseApiResult,
  paymentFailureMessage,
  rejected,
  toPaymentFailure,
  unexpected,
} from '~/modules/checkout/utils/payment-failure';
import { UnreadableResponseError } from '~/utils/api-error-handling';
import { createFetchError } from '../../../../utils';

const GENERIC = 'Something went wrong on our side. Please try again.';

describe('toPaymentFailure', () => {
  it('keeps the backend\'s message on a 400', () => {
    const failure = toPaymentFailure(createFetchError(400, { message: 'Do Not Honor', result: false }));

    expect(failure._tag).toBe('Rejected');
    expect(paymentFailureMessage(failure)).toBe('Do Not Honor');
  });

  it.each([
    ['has no message', { result: false }],
    ['has an unknown shape', { message: 42 }],
  ])('uses generic copy for a 400 whose body %s', (_, body) => {
    const failure = toPaymentFailure(createFetchError(400, body));

    expect(failure._tag).toBe('Rejected');
    expect(paymentFailureMessage(failure)).toBe(GENERIC);
  });

  it('reads a 403 as an unverified account', () => {
    expect(toPaymentFailure(createFetchError(403))._tag).toBe('Unverified');
  });

  it.each([404, 429, 500, 502, 503])('reads a %i as a server error', (status) => {
    expect(toPaymentFailure(createFetchError(status))._tag).toBe('ServerError');
  });

  it('reads a body that is not JSON as a server error', () => {
    expect(toPaymentFailure(new UnreadableResponseError())._tag).toBe('ServerError');
  });

  it('reads anything else as unexpected and keeps the cause', () => {
    const cause = new TypeError('cannot read properties of undefined');

    expect(toPaymentFailure(cause)).toEqual({ _tag: 'Unexpected', cause });
  });
});

describe('paymentFailureMessage', () => {
  it('never shows the message of a bug', () => {
    const failure = unexpected(new TypeError('cannot read properties of undefined'));

    expect(paymentFailureMessage(failure)).toBe(GENERIC);
  });

  it('never shows the request details of a server error', () => {
    const failure = toPaymentFailure(createFetchError(500));

    expect(paymentFailureMessage(failure)).toBe(GENERIC);
  });

  it('tells an unverified account what to do', () => {
    expect(paymentFailureMessage(toPaymentFailure(createFetchError(403)))).toBe('You need to first verify your e-mail address.');
  });
});

describe('isOutcomeUnknown', () => {
  it('rules out a charge when the backend refused', () => {
    expect(isOutcomeUnknown(rejected('Do Not Honor'))).toBe(false);
    expect(isOutcomeUnknown(toPaymentFailure(createFetchError(403)))).toBe(false);
  });

  it('cannot rule out a charge after a server error or a bug', () => {
    expect(isOutcomeUnknown(toPaymentFailure(createFetchError(500)))).toBe(true);
    expect(isOutcomeUnknown(unexpected(new Error('bug')))).toBe(true);
  });
});

describe('parseApiResult', () => {
  const parse = parseApiResult(ActionResultResponseSchema);

  it('returns the result', async () => {
    await expect(parse({ result: true })).resolves.toEqual({ ok: true, value: true });
  });

  it('treats a false result as the backend refusing, with its message', async () => {
    const parsed = await parse({ message: 'Upgrade not allowed', result: false });

    expect(parsed).toEqual({ error: rejected('Upgrade not allowed'), ok: false });
  });

  it('uses generic copy when a refusal has no message', async () => {
    const parsed = await parse({ result: false });

    expect(parsed).toEqual({ error: rejected(GENERIC), ok: false });
  });

  it('treats a body in an unknown shape as unexpected', async () => {
    const parsed = await parse({ result: 'yes' });

    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.error._tag).toBe('Unexpected');
  });
});
