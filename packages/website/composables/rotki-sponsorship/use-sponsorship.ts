import { get, set } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';
import { SPONSORSHIP_TIERS, type TierBenefits, type TierInfoResult, type TierSupply } from './types';
import { isTierAvailable as isTierAvailableUtil } from './utils';

/**
 * SSR-only version of useRotkiSponsorship
 * This is the main composable that should be used for data fetching
 */
function useRotkiSponsorshipSSR() {
  const tierSupply = ref<Record<string, TierSupply>>({});
  const tierBenefits = ref<Record<string, TierBenefits>>({});
  const nftImages = ref<Record<string, string>>({});
  const releaseName = ref<string>('');
  const releaseId = ref<number>();
  const isLoading = ref<boolean>(false);
  const error = ref<string>();

  const logger = useLogger('rotki-sponsorship-ssr');

  const isTierAvailable = (tierKey: string): boolean => isTierAvailableUtil(tierKey, get(tierSupply));

  async function loadAll(forceRefresh = false): Promise<void> {
    set(isLoading, true);
    set(error, undefined);

    try {
      // Load tier data from the tier-info API endpoint
      const tierIds = SPONSORSHIP_TIERS.map(t => t.tierId).join(',');
      const params: Record<string, string> = { tierIds };

      if (forceRefresh) {
        params.skipCache = 'true';
      }

      const response = await $fetch<{ tiers: Record<number, TierInfoResult | undefined>; releaseId: number }>('/api/nft/tier-info', {
        params,
      });

      const images: Record<string, string> = {};
      const supplies: Record<string, TierSupply> = {};
      const benefits: Record<string, TierBenefits> = {};
      let fetchedReleaseName = '';

      // Process the results
      for (const tier of SPONSORSHIP_TIERS) {
        const tierInfo = response.tiers[tier.tierId];
        if (tierInfo) {
          images[tier.key] = tierInfo.imageUrl;
          supplies[tier.key] = {
            currentSupply: tierInfo.currentSupply,
            maxSupply: tierInfo.maxSupply,
            metadataURI: tierInfo.metadataURI,
          };
          benefits[tier.key] = {
            benefits: tierInfo.benefits,
          };
          if (tierInfo.releaseName && !fetchedReleaseName) {
            fetchedReleaseName = tierInfo.releaseName;
          }
        }
      }

      set(nftImages, images);
      set(tierSupply, supplies);
      set(tierBenefits, benefits);
      set(releaseName, fetchedReleaseName);
      set(releaseId, response.releaseId);

      logger.info('Successfully loaded all tier data via API');
    }
    catch (error_) {
      const errorMessage = 'Failed to load tier data';
      set(error, errorMessage);
      logger.error('Error loading tier data:', error_);
      throw new Error(errorMessage);
    }
    finally {
      set(isLoading, false);
    }
  }

  return {
    // State
    error: readonly(error),
    isLoading: readonly(isLoading),
    // Methods
    isTierAvailable,
    loadAll,
    nftImages: readonly(nftImages),
    releaseId: readonly(releaseId),
    releaseName: readonly(releaseName),
    tierBenefits: readonly(tierBenefits),
    tierSupply: readonly(tierSupply),
  };
}

/**
 * Composable for easy data fetching with useLazyAsyncData
 * This should be used in pages/components for SSR data loading
 */
export function useSponsorshipData() {
  const ssr = useRotkiSponsorshipSSR();
  const forceRefresh = ref(false);
  const route = useRoute();

  // Use a stable key for SSR deduplication
  const dataKey = 'sponsorship-data';

  const { data, error, pending, refresh: refreshData } = useAsyncData(dataKey, async () => {
    await ssr.loadAll(get(forceRefresh));
    // Reset force refresh flag after use
    set(forceRefresh, false);
    return {
      error: get(ssr.error),
      nftImages: get(ssr.nftImages),
      releaseId: get(ssr.releaseId),
      releaseName: get(ssr.releaseName),
      tierBenefits: get(ssr.tierBenefits),
      tierSupply: get(ssr.tierSupply),
    };
  }, {
    // Only watch on client side to avoid multiple SSR calls
    watch: import.meta.client ? [() => route.path] : [],
  });

  // Create a custom refresh function that forces cache bypass
  async function refresh() {
    // Set force refresh flag before refreshing
    set(forceRefresh, true);
    // Force refresh the data through useAsyncData
    await refreshData();
  }

  // Return the data with the correct loading state from useAsyncData
  return {
    data,
    error,
    pending,
    refresh,
  };
}
