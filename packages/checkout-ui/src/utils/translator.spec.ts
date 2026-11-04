import { describe, expect, it } from 'vitest';
import { createTranslator } from './translator';

describe('createTranslator', () => {
  const t = createTranslator({
    due_today: 'Due today',
    renews: 'Then {amount} per month from {date}',
    saving: 'You save {amount}',
  });

  it('returns the message for a known key', () => {
    expect(t('due_today')).toBe('Due today');
  });

  it('fills every placeholder, numbers included', () => {
    expect(t('renews', { amount: '25.00 €', date: 'November 2, 2026' }))
      .toBe('Then 25.00 € per month from November 2, 2026');
    expect(t('saving', { amount: 2.5 })).toBe('You save 2.5');
  });

  it('returns the key for an unknown message so a gap is visible', () => {
    expect(t('missing.key')).toBe('missing.key');
  });

  it('leaves placeholders without a value as written', () => {
    expect(t('renews', { amount: '25.00 €' })).toBe('Then 25.00 € per month from {date}');
  });

  it('ignores params when the message has no placeholders', () => {
    expect(t('due_today', { amount: 1 })).toBe('Due today');
  });
});
