import type { Web3ConnectionConfig } from './web3-connection';
import { get, set } from '@vueuse/core';
import { Contract, ethers, type TransactionResponse } from 'ethers';
import { useLogger } from '~/utils/use-logger';

const CONTRACT_ADDRESS = '0x281986c18a5680C149b95Fc15aa266b633B60e96';
const CHAIN_ID = 11155111; // Sepolia testnet
const RPC_URL = 'https://sepolia.gateway.tenderly.co';
const IPFS_URL = 'https://gateway.pinata.cloud/ipfs/';

const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, bytes32 currencySymbol) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function ETH() external view returns (bytes32)',
  'function mint(uint256 tierId, bytes32 currencySymbol) external payable',
];

export interface SponsorshipTier {
  key: string;
  label: string;
  tierId: number;
}

export const SPONSORSHIP_TIERS: SponsorshipTier[] = [
  { key: 'bronze', label: 'Bronze', tierId: 0 },
  { key: 'silver', label: 'Silver', tierId: 1 },
  { key: 'gold', label: 'Gold', tierId: 2 },
];

export interface TierSupply {
  maxSupply: number;
  currentSupply: number;
  metadataURI: string;
}

export interface TierBenefits {
  description: string;
  benefits: string;
}

export interface SponsorshipState {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

export function useRotkiSponsorship(config: Web3ConnectionConfig = {}) {
  const sponsorshipState = ref<SponsorshipState>({ status: 'idle' });
  const tierPrices = ref<Record<string, string>>({});
  const tierSupply = ref<Record<string, TierSupply>>({});
  const tierBenefits = ref<Record<string, TierBenefits>>({});
  const nftImages = ref<Record<string, string>>({});
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const logger = useLogger('rotki-sponsorship');
  const { t } = useI18n();

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
    ...config,
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

  async function fetchTierPrices() {
    try {
      const prices: Record<string, string> = {};
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);
      const ethSymbol = await contract.ETH();

      for (const tier of SPONSORSHIP_TIERS) {
        const price = await contract.getPrice(tier.tierId, ethSymbol);
        prices[tier.key] = ethers.formatEther(price);
      }

      set(tierPrices, prices);
    }
    catch (error_) {
      logger.error('Error fetching tier prices:', error_);
    }
  }

  async function fetchTierInfo(tierId: number, tierKey: string) {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

      const releaseId = await contract.currentReleaseId();
      const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

      if (!metadataURI) {
        return null;
      }

      // Convert metadataURI (IPFS CID) to HTTP URL to fetch the JSON metadata
      let metadataUrl = metadataURI;
      if (metadataURI.startsWith('ipfs://')) {
        metadataUrl = `${IPFS_URL}${metadataURI.slice(7)}`;
      }

      // Fetch the metadata JSON
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Metadata fetch error: ${metadataResponse.status}`);
      }

      const metadata = await metadataResponse.json();

      // Extract image URL from metadata.image
      let imageUrl = metadata.image;
      if (imageUrl && imageUrl.startsWith('ipfs://')) {
        imageUrl = `${IPFS_URL}${imageUrl.slice(7)}`;
      }

      // Extract benefits from attributes
      const benefitsAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Benefits');
      const benefits = benefitsAttribute?.value || '';

      return {
        benefits,
        currentSupply: Number(currentSupply),
        description: metadata.description || '',
        imageUrl,
        maxSupply: Number(maxSupply),
        metadataURI,
      };
    }
    catch (error_) {
      logger.error(`Error fetching tier info for ${tierKey}:`, error_);
      return null;
    }
  }

  async function loadNFTImages() {
    set(isLoading, true);
    set(error, null);

    try {
      const images: Record<string, string> = {};
      const supplies: Record<string, TierSupply> = {};
      const benefits: Record<string, TierBenefits> = {};

      for (const tier of SPONSORSHIP_TIERS) {
        const tierInfo = await fetchTierInfo(tier.tierId, tier.key);
        if (tierInfo) {
          images[tier.key] = tierInfo.imageUrl;
          supplies[tier.key] = {
            currentSupply: tierInfo.currentSupply,
            maxSupply: tierInfo.maxSupply,
            metadataURI: tierInfo.metadataURI,
          };
          benefits[tier.key] = {
            benefits: tierInfo.benefits,
            description: tierInfo.description,
          };
        }
      }

      set(nftImages, images);
      set(tierSupply, supplies);
      set(tierBenefits, benefits);
    }
    catch (error_) {
      set(error, 'Failed to load NFT images and supply data');
      logger.error('Error loading NFT images:', error_);
    }
    finally {
      set(isLoading, false);
    }
  }

  async function mintSponsorshipNFT(tierId: number): Promise<void> {
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
      const price = prices[tierKey];
      const supply = supplies[tierKey];

      if (!price) {
        throw new Error('Price not available for this tier');
      }

      if (!supply) {
        throw new Error('Supply information not available for this tier');
      }

      // Check if tier is sold out (maxSupply = 0 means unlimited)
      if (supply.maxSupply > 0 && supply.currentSupply >= supply.maxSupply) {
        throw new Error(`${tierKey.charAt(0).toUpperCase() + tierKey.slice(1)} tier is sold out`);
      }

      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, signer);

      // Get the ETH symbol from the contract
      const ethSymbol = await contract.ETH();

      const tx: TransactionResponse = await contract.mint(tierId, ethSymbol, {
        value: ethers.parseEther(price),
      });

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
        await refreshSupplyData();
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

  async function refreshSupplyData(): Promise<void> {
    try {
      const supplies: Record<string, TierSupply> = {};
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

      // Get current release ID from contract
      const releaseId = await contract.currentReleaseId();

      for (const tier of SPONSORSHIP_TIERS) {
        const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tier.tierId);

        supplies[tier.key] = {
          currentSupply: Number(currentSupply),
          maxSupply: Number(maxSupply),
          metadataURI,
        };
      }

      set(tierSupply, supplies);
    }
    catch (error_) {
      logger.error('Error refreshing supply data:', error_);
    }
  }

  function resetSponsorshipState(): void {
    set(sponsorshipState, { status: 'idle' });
  }

  return {
    // Connection state and methods
    ...connectionMethods,
    blockExplorerUrl,
    connected,

    error: readonly(error),
    // Methods
    fetchTierPrices,
    isExpectedChain,
    isLoading: readonly(isLoading),
    isTierAvailable,
    loadNFTImages,
    mintSponsorshipNFT,
    nftImages: readonly(nftImages),

    resetSponsorshipState,
    // Sponsorship specific state
    sponsorshipState: readonly(sponsorshipState),
    tierBenefits: readonly(tierBenefits),
    tierPrices: readonly(tierPrices),
    tierSupply: readonly(tierSupply),
    transactionUrl,
  };
}
