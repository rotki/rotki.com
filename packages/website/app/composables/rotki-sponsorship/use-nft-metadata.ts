import { type SimpleTokenMetadata, TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { useLogger } from '~/utils/use-logger';

export function useNftMetadata() {
  const logger = useLogger();

  async function fetchNftMetadata(tokenId: number | string): Promise<SimpleTokenMetadata | undefined> {
    try {
      const response = await $fetch<TokenMetadata>(`/api/nft/${tokenId}`);

      const result = TokenMetadata.parse(response);

      if (result && result.tierName) {
        const { releaseId, releaseName } = result;

        let usedReleaseName: string;
        if (releaseName) {
          usedReleaseName = releaseName.startsWith('v') ? releaseName : `v${releaseName}`;
        }
        else {
          usedReleaseName = `v${releaseId}`;
        }

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
