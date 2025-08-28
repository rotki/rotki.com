import { consola } from 'consola';
import { loadNFTImagesAndSupplySSR } from '~/composables/rotki-sponsorship/metadata-ssr';
import { SPONSORSHIP_TIERS } from '~/composables/rotki-sponsorship/types';

export async function warmNftCache() {
  // Only run cache warming on the first PM2 instance (or when not using PM2)
  // eslint-disable-next-line node/prefer-global/process
  const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
  if (instanceId !== '0') {
    consola.info(`[NFT Cache Warmer] Skipping cache warming on PM2 instance ${instanceId}`);
  }

  // Check if sponsorship feature is enabled
  const { public: { sponsorshipEnabled } } = useRuntimeConfig();
  if (!sponsorshipEnabled) {
    consola.info('[NFT Cache Warmer] Sponsorship feature is disabled, skipping cache warming');
    return;
  }

  consola.info('[NFT Cache Warmer] Starting cache warming on primary PM2 instance');

  try {
    // Use the existing SSR function to warm the cache
    const result = await loadNFTImagesAndSupplySSR(SPONSORSHIP_TIERS);

    // Log the results
    if (result) {
      const cachedTiers = Object.keys(result.supplies).length;
      consola.success(`[NFT Cache Warmer] Successfully warmed cache for ${cachedTiers} tiers`);

      // Also warm the image cache by pre-fetching tier images
      // This is done separately to avoid blocking the initial response
      setTimeout(() => {
        (async () => {
          try {
            const imageUrls: string[] = [];
            for (const key of Object.keys(result.images)) {
              const imageUrl = result.images[key];
              if (imageUrl) {
                // Extract the actual URL from the proxy endpoint
                const match = imageUrl.match(/url=([^&]+)/);
                if (match && match[1]) {
                  imageUrls.push(decodeURIComponent(match[1]));
                }
              }
            }

            if (imageUrls.length > 0) {
              consola.info(`[NFT Cache Warmer] Pre-fetching ${imageUrls.length} tier images`);

              // Fetch images in parallel with limited concurrency
              const imagePromises = imageUrls.map(async url =>
                $fetch(`/api/nft/image?url=${encodeURIComponent(url)}`, {
                  retry: 1,
                  retryDelay: 500,
                }).catch((error: any) => {
                  consola.warn(`[NFT Cache Warmer] Failed to pre-fetch image: ${error.message}`);
                }),
              );

              await Promise.all(imagePromises);
              consola.success(`[NFT Cache Warmer] Image cache warming completed`);
            }
          }
          catch (error) {
            consola.error('[NFT Cache Warmer] Error during image cache warming:', error);
          }
        })();
      }, 5000); // Delay image fetching by 5 seconds to not block app startup
    }
    else {
      consola.warn('[NFT Cache Warmer] No tier data returned from API');
    }
  }
  catch (error) {
    consola.error('[NFT Cache Warmer] Error during cache warming:', error);
  }
}
