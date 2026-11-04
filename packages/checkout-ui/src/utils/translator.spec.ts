import { describe, expect, it } from 'vitest';
import { createTranslator } from './translator';

describe('createTranslator', () => {
  const t = createTranslator({
    checkout: {
      due_today: 'Due today',
      renews: 'Then {amount} per month from {date}',
      saving: 'You save {amount}',
    },
    flat: 'Top level',
  });

  it('returns the message for a dotted key', () => {
    expect(t('checkout.due_today')).toBe('Due today');
    expect(t('flat')).toBe('Top level');
  });

  it('fills every placeholder, numbers included', () => {
    expect(t('checkout.renews', { amount: '25.00 €', date: 'November 2, 2026' }))
      .toBe('Then 25.00 € per month from November 2, 2026');
    expect(t('checkout.saving', { amount: 2.5 })).toBe('You save 2.5');
  });

  it('returns the key for an unknown message so a gap is visible', () => {
    expect(t('checkout.missing')).toBe('checkout.missing');
    expect(t('flat.deeper')).toBe('flat.deeper');
  });

  it('returns the key when it points at a group instead of a message', () => {
    expect(t('checkout')).toBe('checkout');
  });

  it('leaves placeholders without a value as written', () => {
    expect(t('checkout.renews', { amount: '25.00 €' })).toBe('Then 25.00 € per month from {date}');
  });

  it('ignores params when the message has no placeholders', () => {
    expect(t('checkout.due_today', { amount: 1 })).toBe('Due today');
  });
});
