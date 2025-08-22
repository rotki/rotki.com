import { type SimpleTokenMetadata, TokenMetadata } from '~/composables/rotki-sponsorship/types';

export function useNftMetadata() {
  const logger = useLogger();

  async function fetchNftMetadata(tokenId: number | string): Promise<SimpleTokenMetadata | undefined> {
    try {
      const response = await $fetch<TokenMetadata>(`/api/nft/${tokenId}`);

      const result = TokenMetadata.parse(response);

      if (result && result.tierName) {
        const { releaseId, releaseName } = result;

        const usedReleaseName = releaseName
          ? (releaseName.startsWith('v') ? releaseName : `v${releaseName}`)
          : `v${releaseId}`;

        return {
          owner: result.owner,
          releaseId: result.releaseId,
          releaseName: usedReleaseName,
          tier: result.tierName,
        };
      }
    }
    catch (error) {
      logger.error(`Failed to fetch NFT metadata for token ${tokenId}:`, error);
    }

    return undefined;
  }

  return {
    fetchNftMetadata,
  };
}
