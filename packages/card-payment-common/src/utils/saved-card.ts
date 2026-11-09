/** A payment method from the Braintree vault; only cards carry the fields read here. */
export interface VaultPaymentMethod {
  type: string;
  details?: object;
}

/** What the buyer reads when the vault no longer has the card they picked. */
export const CARD_NOT_IN_VAULT_MESSAGE = 'We could not find that card. Please refresh the page and try again.';

/** The month and full year of an expiry written as `MM/YY` or `MM/YYYY`. */
function parseCardExpiry(expiresAt: string): { month: number; year: number } | undefined {
  const parts = /^(\d{2})\/(\d{2,4})$/.exec(expiresAt);
  if (!parts)
    return undefined;
  const year = Number(parts[2]);
  return { month: Number(parts[1]), year: year < 100 ? year + 2000 : year };
}

/** A card works until the end of its expiry month; an expiry that cannot be read counts as expired. */
export function isCardExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expiry = parseCardExpiry(expiresAt);
  if (!expiry)
    return true;
  const year = now.getFullYear();
  return expiry.year < year || (expiry.year === year && expiry.month < now.getMonth() + 1);
}

/** Compares a vault entry's expiry with a saved card's, on the two year digits a card prints. */
function expiryMatches(details: object, expiresAt: string): boolean {
  const expiry = parseCardExpiry(expiresAt);
  if (!expiry || !('expirationMonth' in details) || !('expirationYear' in details))
    return false;
  const { expirationMonth, expirationYear } = details;
  return typeof expirationMonth === 'string'
    && typeof expirationYear === 'string'
    && Number(expirationMonth) === expiry.month
    && expirationYear.slice(-2) === String(expiry.year).slice(-2);
}

/**
 * The BIN of a saved card, which 3D Secure needs and the API does not return. The vault entries
 * carry no token, so the last four digits are the coarsest key and the expiry separates two cards
 * sharing them. If both still match, it is the same card saved twice and the BIN is the same.
 */
export function findVaultBin(methods: readonly VaultPaymentMethod[], last4: string, expiresAt: string): string | undefined {
  const matches = methods.filter(({ type, details }) =>
    type === 'CreditCard' && details && 'lastFour' in details && details.lastFour === last4);

  const method = matches.find(({ details }) => details && expiryMatches(details, expiresAt)) ?? matches[0];
  if (method?.details && 'bin' in method.details && typeof method.details.bin === 'string' && method.details.bin)
    return method.details.bin;
  return undefined;
}
