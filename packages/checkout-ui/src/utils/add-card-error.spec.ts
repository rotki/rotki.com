import { describe, expect, it } from 'vitest';
import { checkoutMessages } from '../messages/en';
import { addCardErrorMessage, isCardAddedFailure } from './add-card-error';
import { createTranslator } from './translator';

const t = createTranslator(checkoutMessages);

describe('addCardErrorMessage', () => {
  it('says the card was not usable after it was saved', () => {
    const message = addCardErrorMessage(t, { code: 'card_add_failed', message: 'Do Not Honor', status: 400 });

    expect(message).toContain('couldn\'t process this payment method');
    expect(message).toContain('support@rotki.com');
    expect(message).not.toContain('Do Not Honor');
  });

  it('hides a gateway dump behind friendly copy', () => {
    const message = addCardErrorMessage(t, { message: 'processor declined 2046', status: 400 });

    expect(message).toBe('We couldn\'t add this card. Please double-check the details or try a different card.');
  });

  it('separates a limit from too many failed cards', () => {
    expect(addCardErrorMessage(t, { message: 'Too many attempts', status: 429 })).toContain('Too many add-card attempts');
    expect(addCardErrorMessage(t, { message: 'Too many failed attempts', status: 429 })).toContain('Too many failed card attempts');
    expect(addCardErrorMessage(t, { status: 429 })).toContain('Too many add-card attempts');
  });

  it('has nothing to say about other failures', () => {
    expect(addCardErrorMessage(t, { message: 'boom', status: 500 })).toBeUndefined();
  });
});

describe('isCardAddedFailure', () => {
  it('needs both the status and the code', () => {
    expect(isCardAddedFailure({ code: 'card_add_failed', status: 400 })).toBe(true);
    expect(isCardAddedFailure({ status: 400 })).toBe(false);
    expect(isCardAddedFailure({ code: 'card_add_failed', status: 500 })).toBe(false);
  });
});
