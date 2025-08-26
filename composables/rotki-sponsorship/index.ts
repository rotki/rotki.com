import { get, set } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';
import { loadNFTImagesAndSupplySSR } from './metadata-ssr';
import { SPONSORSHIP_TIERS, type TierBenefits, type TierSupply } from './types';
import { isTierAvailable as isTierAvailableUtil } from './utils';

/**
 * SSR-only version of useRotkiSponsorship
 * This is the main composable that should be used for data fetching
 */
export function useRotkiSponsorshipSSR() {
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
      // Load tier data from server API (includes images, supply, benefits)
      const { benefits, images, releaseId: fetchedReleaseId, releaseName: fetchedReleaseName, supplies } = await loadNFTImagesAndSupplySSR(SPONSORSHIP_TIERS, forceRefresh);

      set(nftImages, images);
      set(tierSupply, supplies);
      set(tierBenefits, benefits);
      set(releaseName, fetchedReleaseName);
      set(releaseId, fetchedReleaseId);

      logger.info('Successfully loaded all tier data via SSR');
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
export async function useSponsorshipData() {
  const ssr = useRotkiSponsorshipSSR();
  const forceRefresh = ref(false);
  const route = useRoute();

  // Use a stable key for SSR deduplication
  const dataKey = 'sponsorship-data';

  const { data, error, pending, refresh: refreshData } = await useAsyncData(dataKey, async () => {
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
