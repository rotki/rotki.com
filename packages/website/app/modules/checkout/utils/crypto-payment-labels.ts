import type { CryptoPayment } from '~/types';
import { segmentAfterFirst } from '~/modules/web3/core/format';
import { toTitleCase } from '~/utils/text';

export interface CryptoPaymentLabels {
  /** The token symbol; `cryptocurrency` is a full asset id such as "ethereum sepolia:ETH". */
  token: string;
  network: string;
  /** The amount to send with its symbol, e.g. "0.01 ETH". */
  amount: string;
}

/** How a crypto payment's token, network and amount read on the page. */
export function cryptoPaymentLabels(payment: Pick<CryptoPayment, 'cryptocurrency' | 'chainName' | 'finalPriceInCrypto'>): CryptoPaymentLabels {
  const token = segmentAfterFirst(payment.cryptocurrency, ':') ?? payment.cryptocurrency;
  return { amount: `${payment.finalPriceInCrypto} ${token}`, network: toTitleCase(payment.chainName), token };
}
