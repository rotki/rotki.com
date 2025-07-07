import { get, set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';
import { CHAIN_ID, USDC_ADDRESS } from './constants';
import { checkPaymentTokenEnabled, fetchTierPrices, refreshSupplyData } from './contract';
import { loadNFTImagesAndSupply } from './metadata';
import { approveUSDC, checkUSDCAllowance, mintSponsorshipNFT as mintNFT } from './payment';
import { CURRENCY_OPTIONS, SPONSORSHIP_TIERS, type SponsorshipState, type TierBenefits, type TierSupply } from './types';

export * from './types';

export function useRotkiSponsorship() {
  const sponsorshipState = ref<SponsorshipState>({ status: 'idle' });
  const selectedCurrency = ref<string>('ETH');
  const tierPrices = ref<Record<string, Record<string, string>>>({});
  const tierSupply = ref<Record<string, TierSupply>>({});
  const tierBenefits = ref<Record<string, TierBenefits>>({});
  const nftImages = ref<Record<string, string>>({});
  const releaseName = ref<string>('');
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const usdcContractAddress = ref<string | null>(null);
  const enabledCurrencies = ref<string[]>(['ETH']); // ETH is always enabled

  const logger = useLogger('rotki-sponsorship');
  const { t } = useI18n({ useScope: 'global' });

  const connection = useWeb3Connection({
    chainId: CHAIN_ID,
    onAccountChange: (isConnected) => {
      if (!isConnected) {
        set(sponsorshipState, { status: 'idle' });
      }
    },
    onError: (error) => {
      set(sponsorshipState, { error, status: 'error' });
    },
  });

  const {
    connected,
    getNetwork,
    getSigner,
    isExpectedChain,
    ...connectionMethods
  } = connection;

  const blockExplorerUrl = computed(() => {
    const network = getNetwork(CHAIN_ID);
    return network.blockExplorers?.default.url;
  });

  const transactionUrl = computed(() => {
    const state = get(sponsorshipState);
    const explorerUrl = get(blockExplorerUrl);

    if (state.txHash && explorerUrl) {
      return `${explorerUrl}/tx/${state.txHash}`;
    }

    return null;
  });

  const isTierAvailable = (tierKey: string) => {
    const supplies = get(tierSupply);
    const supply = supplies[tierKey];

    if (!supply)
      return false;

    // maxSupply = 0 means unlimited
    if (supply.maxSupply === 0)
      return true;

    return supply.currentSupply < supply.maxSupply;
  };

  async function loadEnabledCurrencies() {
    try {
      logger.info('Loading enabled currencies...');
      // ETH is always enabled
      const currencies = ['ETH'];

      // Check if USDC is enabled as a payment token
      logger.info(`Checking if USDC (${USDC_ADDRESS}) is enabled...`);
      const isUsdcEnabled = await checkPaymentTokenEnabled(USDC_ADDRESS);

      if (isUsdcEnabled) {
        currencies.push('USDC');
        set(usdcContractAddress, USDC_ADDRESS);

        // Update CURRENCY_OPTIONS with the address
        const usdcOption = CURRENCY_OPTIONS.find(option => option.key === 'USDC');
        if (usdcOption) {
          usdcOption.contractAddress = USDC_ADDRESS;
        }
        logger.info('USDC payment option enabled');
      }
      else {
        logger.info('USDC payment option disabled');
      }

      set(enabledCurrencies, currencies);
      logger.info(`Enabled currencies: ${currencies.join(', ')}`);

      // If selected currency is not enabled, switch to ETH
      if (!currencies.includes(get(selectedCurrency))) {
        set(selectedCurrency, 'ETH');
      }
    }
    catch (error_) {
      logger.error('Error loading enabled currencies:', error_);
    }
  }

  async function loadNFTImages() {
    set(isLoading, true);
    set(error, null);
    try {
      // Load enabled currencies first
      await loadEnabledCurrencies();

      const { benefits, images, releaseName: fetchedReleaseName, supplies } = await loadNFTImagesAndSupply(SPONSORSHIP_TIERS);

      set(nftImages, images);
      set(tierSupply, supplies);
      set(tierBenefits, benefits);
      set(releaseName, fetchedReleaseName);

      // Fetch tier prices
      const prices = await fetchTierPrices();
      set(tierPrices, prices);
    }
    catch (error_) {
      set(error, 'Failed to load NFT images and supply data');
      logger.error('Error loading NFT images:', error_);
    }
    finally {
      set(isLoading, false);
    }
  }

  async function mintSponsorshipNFT(tierId: number, currency = 'ETH'): Promise<void> {
    if (get(sponsorshipState).status === 'pending') {
      throw new Error('Minting already in progress');
    }

    set(sponsorshipState, { status: 'pending' });

    try {
      if (!get(connected)) {
        throw new Error(t('subscription.crypto_payment.not_connected'));
      }

      const prices = get(tierPrices);
      const supplies = get(tierSupply);
      const tierKey = tierId === 0 ? 'bronze' : tierId === 1 ? 'silver' : 'gold';
      const tierPricesForTier = prices[tierKey];
      const price = tierPricesForTier?.[currency];
      const supply = supplies[tierKey];

      if (!price) {
        throw new Error(`Price not available for this tier in ${currency}`);
      }

      if (!supply) {
        throw new Error('Supply information not available for this tier');
      }

      // Check if tier is sold out (maxSupply = 0 means unlimited)
      if (supply.maxSupply > 0 && supply.currentSupply >= supply.maxSupply) {
        throw new Error(`${tierKey.charAt(0).toUpperCase() + tierKey.slice(1)} tier is sold out`);
      }

      const signer = await getSigner();
      const tx = await mintNFT(tierId, currency, price, signer);

      set(sponsorshipState, {
        status: 'pending',
        txHash: tx.hash,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        set(sponsorshipState, {
          status: 'success',
          txHash: tx.hash,
        });

        // Refresh supply data after successful mint
        const updatedSupplies = await refreshSupplyData();
        set(tierSupply, updatedSupplies);
      }
      else {
        throw new Error('Transaction failed');
      }
    }
    catch (error: any) {
      logger.error('Minting failed:', error);
      const errorMessage = error.shortMessage || error.message || 'Minting failed';

      set(sponsorshipState, {
        error: errorMessage,
        status: 'error',
      });

      throw error;
    }
  }

  async function approveUSDCWrapper(amount: string) {
    const signer = await getSigner();
    return approveUSDC(amount, signer);
  }

  async function checkUSDCAllowanceWrapper() {
    const signer = await getSigner();
    return checkUSDCAllowance(signer);
  }

  return {
    // Connection state and methods
    ...connectionMethods,
    approveUSDC: approveUSDCWrapper,
    blockExplorerUrl,
    checkPaymentTokenEnabled,
    checkUSDCAllowance: checkUSDCAllowanceWrapper,
    connected,
    enabledCurrencies: readonly(enabledCurrencies),
    error: readonly(error),
    fetchTierPrices,
    isExpectedChain,
    isLoading: readonly(isLoading),
    isTierAvailable,
    loadEnabledCurrencies,
    loadNFTImages,
    mintSponsorshipNFT,
    nftImages: readonly(nftImages),
    releaseName: readonly(releaseName),
    selectedCurrency,
    sponsorshipState: readonly(sponsorshipState),
    tierBenefits: readonly(tierBenefits),
    tierPrices: readonly(tierPrices),
    tierSupply: readonly(tierSupply),
    transactionUrl,
    usdcContractAddress: readonly(usdcContractAddress),
  };
}
