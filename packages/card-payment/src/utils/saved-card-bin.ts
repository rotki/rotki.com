import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { Client } from 'braintree-web/client';
import { CARD_NOT_IN_VAULT_MESSAGE, findVaultBin } from '@rotki/card-payment-common/utils/saved-card';
import { PaymentUserError } from '@rotki/sigil';
import { create as createVaultManager } from 'braintree-web/vault-manager';

/**
 * BIN of a saved card, read from the Braintree vault. The 3D Secure page cannot start without one,
 * so a card the vault does not have fails here, where the buyer can still pick another.
 */
export async function findSavedCardBin(client: Client | undefined, card: SavedCard): Promise<string> {
  const vaultManager = await createVaultManager({ client });

  try {
    const methods = await vaultManager.fetchPaymentMethods();
    const bin = findVaultBin(methods, card.last4, card.expiresAt);
    if (!bin) {
      throw new PaymentUserError(CARD_NOT_IN_VAULT_MESSAGE, {
        logDetail: `no vault entry for card ending ${card.last4} among ${methods.length} methods`,
      });
    }
    return bin;
  }
  finally {
    await vaultManager.teardown();
  }
}
