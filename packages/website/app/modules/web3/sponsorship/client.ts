import type { Config } from '@wagmi/core';
import type { Bound } from '~/modules/web3/client';

type SponsorshipActions = typeof import('~/modules/web3/sponsorship/actions');

type SponsorshipOp = 'estimateMintFee' | 'mintNft' | 'readCurrentReleaseId' | 'readTierSupplies';

/**
 * Contract ops from `sponsorship/actions`, pre-bound to the wagmi `Config`.
 * `decodeMintedTokenId` is pure (no `Config`), so it is forwarded as-is.
 */
export type SponsorshipClient = {
  [K in SponsorshipOp]: Bound<SponsorshipActions[K]>;
} & {
  decodeMintedTokenId: SponsorshipActions['decodeMintedTokenId'];
};

/**
 * Lazily load `sponsorship/actions` and bind the contract ops to the singleton
 * `Config`. Kept in its own module so the checkout flow never pulls the
 * sponsorship code into its chunk — only `getWeb3Client` is shared.
 */
export async function getSponsorshipClient(ensureInitialized: () => Promise<Config>): Promise<SponsorshipClient> {
  const [config, actions] = await Promise.all([
    ensureInitialized(),
    import('~/modules/web3/sponsorship/actions'),
  ]);
  return {
    decodeMintedTokenId: actions.decodeMintedTokenId,
    estimateMintFee: async (...args) => actions.estimateMintFee(config, ...args),
    mintNft: async (...args) => actions.mintNft(config, ...args),
    readCurrentReleaseId: async (...args) => actions.readCurrentReleaseId(config, ...args),
    readTierSupplies: async (...args) => actions.readTierSupplies(config, ...args),
  };
}
