import type { CryptoPayment } from '~/types';
import { isNativeToken } from '~/modules/web3/core/erc20';

/**
 * Build the wallet payment URI encoded into the manual-payment QR — BIP-21 for
 * bitcoin, EIP-681 for EVM chains. The `parseUnits` amount conversion lives here
 * (lazy `viem` import) so the checkout QR component carries no direct web3-lib
 * import; viem stays contained to `app/modules/web3/`.
 */
export async function buildPaymentUri(payment: CryptoPayment): Promise<string> {
  const { chainId, chainName, cryptoAddress, decimals, finalPriceInCrypto, tokenAddress } = payment;

  if (chainName === 'bitcoin')
    return `bitcoin:${cryptoAddress}?amount=${finalPriceInCrypto}&label=Rotki`;

  const { parseUnits } = await import('viem');
  const amount = parseUnits(finalPriceInCrypto.toString(), decimals ?? 18);

  return isNativeToken(tokenAddress)
    ? `ethereum:${cryptoAddress}@${chainId}?value=${amount}`
    : `ethereum:${tokenAddress}@${chainId}/transfer?address=${cryptoAddress}&uint256=${amount}`;
}
