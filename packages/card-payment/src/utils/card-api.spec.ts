import { PaymentUserError } from '@rotki/sigil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCSRF } from './api';
import { addCard, CardAddedPaymentError, createCardNonce, deleteCard, getSavedCard } from './card-api';

vi.mock('./api', () => ({ fetchWithCSRF: vi.fn() }));

function respond(status: number, body: unknown): void {
  vi.mocked(fetchWithCSRF).mockResolvedValueOnce(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
}

/** What `promise` rejects with, or `undefined` when it resolves. */
async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return undefined;
  }
  catch (error) {
    return error;
  }
}

function sentBody(): unknown {
  const init = vi.mocked(fetchWithCSRF).mock.calls[0]?.[1];
  return JSON.parse(String(init?.body));
}

const card = { expires_at: '11/2029', image_url: 'https://example.com/visa.png', last4: '1111', linked: true, token: 'tok-1' };

describe('utils/card-api', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(fetchWithCSRF).mockReset();
  });

  describe('getSavedCard', () => {
    it('returns the saved cards', async () => {
      respond(200, { cards: [card] });

      await expect(getSavedCard()).resolves.toEqual([{ expiresAt: '11/2029', imageUrl: 'https://example.com/visa.png', last4: '1111', linked: true, token: 'tok-1' }]);
    });

    it.each([
      ['a 404, which means none are saved', 404, { message: 'Not found' }],
      ['a server error', 500, { message: 'boom' }],
      ['a response in an unknown shape', 200, { cards: [{ token: 'tok-1' }] }],
    ])('returns no cards for %s', async (_, status, body) => {
      respond(status, body);

      await expect(getSavedCard()).resolves.toEqual([]);
    });
  });

  describe('addCard', () => {
    it('sends the nonce in snake case and returns the new card\'s token', async () => {
      respond(200, card);

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toBe('tok-1');
      expect(sentBody()).toEqual({ payment_method_nonce: 'nonce-1' });
    });

    it('says the card was vaulted when the backend failed after saving it', async () => {
      respond(400, { code: 'card_add_failed', message: 'Do Not Honor' });

      const error = await rejectionOf(addCard({ paymentMethodNonce: 'nonce-1' }));
      expect(error).toBeInstanceOf(CardAddedPaymentError);
      expect(error).toHaveProperty('message', expect.stringContaining('We couldn\'t process this payment method.'));
    });

    it('shows friendly copy for another 400 instead of the gateway dump', async () => {
      respond(400, { message: 'processor declined 2046' });

      const error = await rejectionOf(addCard({ paymentMethodNonce: 'nonce-1' }));
      expect(error).toBeInstanceOf(PaymentUserError);
      expect(error).not.toBeInstanceOf(CardAddedPaymentError);
      expect(error).toHaveProperty('message', 'We couldn\'t add this card. Please double-check the details or try a different card.');
    });

    it('explains the rate limit', async () => {
      respond(429, { message: 'Too many attempts. Try again in a minute.' });

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).rejects.toThrow('Too many add-card attempts.');
    });

    it('keeps other failures opaque to the buyer', async () => {
      respond(500, 'Internal Server Error');

      const error = await rejectionOf(addCard({ paymentMethodNonce: 'nonce-1' }));
      expect(error).not.toBeInstanceOf(PaymentUserError);
      expect(error).toHaveProperty('message', 'HTTP 500: Internal Server Error');
    });
  });

  describe('createCardNonce', () => {
    it('returns the nonce for a saved card', async () => {
      respond(200, { payment_nonce: 'nonce-2' });

      await expect(createCardNonce({ paymentToken: 'tok-1' })).resolves.toBe('nonce-2');
      expect(sentBody()).toEqual({ payment_token: 'tok-1' });
    });

    it('fails with the backend\'s message', async () => {
      respond(400, { message: 'Card expired' });

      await expect(createCardNonce({ paymentToken: 'tok-1' })).rejects.toThrow('Card expired');
    });
  });

  describe('deleteCard', () => {
    it('deletes the card by its token', async () => {
      respond(204, '');

      await expect(deleteCard('tok-1')).resolves.toBeUndefined();
      expect(vi.mocked(fetchWithCSRF).mock.calls[0]?.[1]?.method).toBe('DELETE');
      expect(sentBody()).toEqual({ payment_token: 'tok-1' });
    });

    it('fails with the backend\'s message', async () => {
      respond(400, { message: 'This card pays your subscription' });

      await expect(deleteCard('tok-1')).rejects.toThrow('This card pays your subscription');
    });
  });
});
