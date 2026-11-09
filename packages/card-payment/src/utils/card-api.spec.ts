import { err, ok } from 'plainfp/result';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCSRF } from './api';
import { failed, userFacing } from './api-failure';
import { addCard, createCardNonce, deleteCard, getSavedCard, trackCardPaymentFailure, trackCardPaymentSubmitted } from './card-api';

vi.mock('./api', () => ({ fetchWithCSRF: vi.fn() }));

function respond(status: number, body: unknown): void {
  vi.mocked(fetchWithCSRF).mockResolvedValueOnce(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
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

      await expect(getSavedCard()).resolves.toEqual(ok([{ expiresAt: '11/2029', imageUrl: 'https://example.com/visa.png', last4: '1111', linked: true, token: 'tok-1' }]));
    });

    it('returns no cards for a 404, which means none are saved', async () => {
      respond(404, { message: 'Not found' });

      await expect(getSavedCard()).resolves.toEqual(ok([]));
    });

    it.each([
      ['a server error', 500, { message: 'boom' }, 'boom'],
      ['a response in an unknown shape', 200, { cards: [{ token: 'tok-1' }] }, 'Invalid response format from server'],
    ])('fails for %s, rather than saying there are no cards', async (_, status, body, message) => {
      respond(status, body);

      await expect(getSavedCard()).resolves.toEqual(err(failed(message)));
    });

    it('fails when the network does', async () => {
      vi.mocked(fetchWithCSRF).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getSavedCard()).resolves.toEqual(err(failed('Failed to fetch')));
    });
  });

  describe('addCard', () => {
    it('sends the nonce in snake case and returns the new card\'s token', async () => {
      respond(200, card);

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toEqual(ok('tok-1'));
      expect(sentBody()).toEqual({ payment_method_nonce: 'nonce-1' });
    });

    it('says the card was vaulted when the backend failed after saving it', async () => {
      respond(400, { code: 'card_add_failed', message: 'Do Not Honor' });

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toMatchObject({
        ok: false,
        error: { _tag: 'UserFacing', cardAdded: true, logDetail: 'Do Not Honor', message: expect.stringContaining('We couldn\'t process this payment method.') },
      });
    });

    it('shows friendly copy for another 400 instead of the gateway dump', async () => {
      respond(400, { message: 'processor declined 2046' });

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toEqual(err(userFacing('We couldn\'t add this card. Please double-check the details or try a different card.', 'processor declined 2046', false)));
    });

    it('explains the rate limit', async () => {
      respond(429, { message: 'Too many attempts. Try again in a minute.' });

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toMatchObject({
        ok: false,
        error: { _tag: 'UserFacing', message: expect.stringContaining('Too many add-card attempts.') },
      });
    });

    it('keeps other failures opaque to the buyer', async () => {
      respond(500, 'Internal Server Error');

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toEqual(err(failed('HTTP 500: Internal Server Error')));
    });

    it('fails on a response in an unknown shape', async () => {
      respond(200, { token: 'tok-1' });

      await expect(addCard({ paymentMethodNonce: 'nonce-1' })).resolves.toEqual(err(failed('Invalid response format from server')));
    });
  });

  describe('createCardNonce', () => {
    it('returns the nonce for a saved card', async () => {
      respond(200, { payment_nonce: 'nonce-2' });

      await expect(createCardNonce({ paymentToken: 'tok-1' })).resolves.toEqual(ok('nonce-2'));
      expect(sentBody()).toEqual({ payment_token: 'tok-1' });
    });

    it('fails with the backend\'s message', async () => {
      respond(400, { message: 'Card expired' });

      await expect(createCardNonce({ paymentToken: 'tok-1' })).resolves.toEqual(err(failed('Card expired')));
    });

    it('fails on a response in an unknown shape', async () => {
      respond(200, { nonce: 'nonce-2' });

      await expect(createCardNonce({ paymentToken: 'tok-1' })).resolves.toEqual(err(failed('Invalid response format from server')));
    });
  });

  describe('deleteCard', () => {
    it('deletes the card by its token', async () => {
      respond(204, '');

      await expect(deleteCard('tok-1')).resolves.toEqual(ok(undefined));
      expect(vi.mocked(fetchWithCSRF).mock.calls[0]?.[1]?.method).toBe('DELETE');
      expect(sentBody()).toEqual({ payment_token: 'tok-1' });
    });

    it('fails with the backend\'s message', async () => {
      respond(400, { message: 'This card pays your subscription' });

      await expect(deleteCard('tok-1')).resolves.toEqual(err(failed('This card pays your subscription')));
    });
  });

  describe('event attribution', () => {
    const track = vi.fn();
    const session = { sessionId: 'sess-abc', utm: { utmSource: 'newsletter', utmCampaign: 'autumn', landingPath: '/' } };

    beforeEach(() => {
      vi.stubGlobal('umami', { track });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response()));
      document.cookie = `_utm=${encodeURIComponent(JSON.stringify(session))}`;
    });

    afterEach(() => {
      document.cookie = '_utm=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      track.mockReset();
      vi.unstubAllGlobals();
    });

    const attribution = { session_id: 'sess-abc', utm_source: 'newsletter', utm_campaign: 'autumn', landing_path: '/' };

    it('tags a submitted card payment with the session in the cookie', () => {
      trackCardPaymentSubmitted({ planId: 1, durationInMonths: 12, isUpgrade: false, cardType: 'new', discountApplied: false });

      expect(track).toHaveBeenCalledWith('payment_submitted', expect.objectContaining({ payment_method: 'card', plan_id: 1, ...attribution }));
    });

    it('tags a failed card payment with the session in the cookie', () => {
      trackCardPaymentFailure({ failure: 'CARD_PAYMENT_API_ERROR', errorMessage: 'boom', planId: 1, isUpgrade: false, step: 'submit' });

      expect(track).toHaveBeenCalledWith('payment_failed', expect.objectContaining({ payment_method: 'card', plan_id: 1, ...attribution }));
    });

    it('still sends the event when the cookie cannot be read', () => {
      const blocked = vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError');
      });

      expect(() => trackCardPaymentSubmitted({ planId: 1, durationInMonths: 12, isUpgrade: false, cardType: 'new', discountApplied: false })).not.toThrow();
      blocked.mockRestore();

      expect(track).toHaveBeenCalledWith('payment_submitted', expect.objectContaining({ payment_method: 'card' }));
    });

    it('still sends the event when there is no cookie', () => {
      document.cookie = '_utm=; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      trackCardPaymentSubmitted({ planId: 1, durationInMonths: 12, isUpgrade: false, cardType: 'new', discountApplied: false });

      const data: unknown = track.mock.calls[0]?.[1];
      expect(data).toEqual(expect.objectContaining({ payment_method: 'card' }));
      expect(data).not.toHaveProperty('utm_source');
    });
  });
});
