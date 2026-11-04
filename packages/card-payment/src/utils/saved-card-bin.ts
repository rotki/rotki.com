import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { Client } from 'braintree-web/client';
import { create as createVaultManager, type VaultManager } from 'braintree-web/vault-manager';

/**
 * BIN of a saved card, which 3D Secure needs and our API does not return. Read from the
 * Braintree vault by matching the last four digits; empty when the vault has no match or
 * the lookup fails.
 */
export async function findSavedCardBin(client: Client | undefined, card: SavedCard): Promise<string> {
  let vaultManager: VaultManager | undefined;

  try {
    vaultManager = await createVaultManager({ client });

    const methods = await vaultManager.fetchPaymentMethods();
    const method = methods.find(({ type, details }) =>
      type === 'CreditCard'
      && details
      && 'lastFour' in details
      && details.lastFour === card.last4,
    );

    if (method?.details && 'bin' in method.details && method.details.bin)
      return method.details.bin;

    return '';
  }
  catch (error) {
    console.error('Failed to fetch bin from vault manager:', error);
    return '';
  }
  finally {
    if (vaultManager)
      await vaultManager.teardown();
  }
}
