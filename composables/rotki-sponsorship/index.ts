import { get, set } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';
import { fetchTierPrices } from './contract';
import { loadNFTImagesAndSupplySSR } from './metadata-ssr';
import { SPONSORSHIP_TIERS, type TierBenefits, type TierSupply } from './types';
import { isTierAvailable as isTierAvailableUtil } from './utils';

/**
 * SSR-only version of useRotkiSponsorship
 * This is the main composable that should be used for data fetching
 */
export function useRotkiSponsorshipSSR() {
  const tierPrices = ref<Record<string, Record<string, string>>>({});
  const tierSupply = ref<Record<string, TierSupply>>({});
  const tierBenefits = ref<Record<string, TierBenefits>>({});
  const nftImages = ref<Record<string, string>>({});
  const releaseName = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const logger = useLogger('rotki-sponsorship-ssr');

  const isTierAvailable = (tierKey: string): boolean => isTierAvailableUtil(tierKey, get(tierSupply));

  async function loadAll(): Promise<void> {
    set(isLoading, true);
    set(error, null);

    try {
      // Load tier data from server API (includes images, supply, benefits)
      const { benefits, images, releaseName: fetchedReleaseName, supplies } = await loadNFTImagesAndSupplySSR(SPONSORSHIP_TIERS);

      set(nftImages, images);
      set(tierSupply, supplies);
      set(tierBenefits, benefits);
      set(releaseName, fetchedReleaseName);

      // Load tier prices
      const prices = await fetchTierPrices();
      set(tierPrices, prices);

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
    releaseName: readonly(releaseName),
    tierBenefits: readonly(tierBenefits),

    tierPrices: readonly(tierPrices),
    tierSupply: readonly(tierSupply),
  };
}

/**
 * Composable for easy data fetching with useLazyAsyncData
 * This should be used in pages/components for SSR data loading
 */
export async function useSponsorshipData() {
  const ssr = useRotkiSponsorshipSSR();

  const { data, error, pending } = await useLazyAsyncData('sponsorship-data', async () => {
    await ssr.loadAll();
    return {
      error: get(ssr.error),
      nftImages: get(ssr.nftImages),
      releaseName: get(ssr.releaseName),
      tierBenefits: get(ssr.tierBenefits),
      tierPrices: get(ssr.tierPrices),
      tierSupply: get(ssr.tierSupply),
    };
  });

  // Return the data with the correct loading state from useLazyAsyncData
  return {
    data,
    error,
    pending,
  };
}
