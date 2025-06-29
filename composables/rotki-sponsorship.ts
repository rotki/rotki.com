/* eslint-disable max-lines */
import { get, set } from '@vueuse/core';
import { Contract, ethers, type TransactionResponse } from 'ethers';
import { useLogger } from '~/utils/use-logger';

const CONTRACT_ADDRESS = '0x281986c18a5680C149b95Fc15aa266b633B60e96';
const CHAIN_ID = 11155111; // Sepolia testnet
const RPC_URL = 'https://sepolia.gateway.tenderly.co';
const IPFS_URL = 'https://gateway.pinata.cloud/ipfs/';

// Currency symbols (keccak256 hashes)
const USDC_SYMBOL = '0xd6aca1be9729c13d677335161321649cccae6a591554772516700f986f942eaa';

const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, bytes32 currencySymbol) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function ETH() external view returns (bytes32)',
  'function mint(uint256 tierId, bytes32 currencySymbol) external payable',
  'function paymentTokens(bytes32 symbol) external view returns (address)',
];

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
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

export interface CurrencyOption {
  key: string;
  label: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  iconUrl?: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    decimals: 18,
    iconUrl: '/img/chains/ethereum.svg',
    key: 'ETH',
    label: 'ETH',
    symbol: 'ETH',
  },
  {
    decimals: 6,
    iconUrl: '/img/usdc.svg',
    key: 'USDC',
    label: 'USDC',
    symbol: 'USDC',
  },
];

export interface SponsorshipState {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

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

  async function getPaymentTokenAddress(symbol: string): Promise<string | null> {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

      const symbolHash = ethers.keccak256(ethers.toUtf8Bytes(symbol));
      const tokenAddress = await contract.paymentTokens(symbolHash);

      // address(0) means ETH, but for other tokens we need a valid address
      if (tokenAddress === ethers.ZeroAddress) {
        return symbol === 'ETH' ? null : null; // null indicates not supported
      }

      return tokenAddress;
    }
    catch (error_) {
      logger.error(`Error fetching payment token address for ${symbol}:`, error_);
      return null;
    }
  }

  async function loadUSDCAddress() {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

      const tokenAddress = await contract.paymentTokens(USDC_SYMBOL);

      if (tokenAddress !== ethers.ZeroAddress) {
        set(usdcContractAddress, tokenAddress);

        // Update CURRENCY_OPTIONS with the fetched address
        const usdcOption = CURRENCY_OPTIONS.find(option => option.key === 'USDC');
        if (usdcOption) {
          usdcOption.contractAddress = tokenAddress;
        }
      }
    }
    catch (error_) {
      logger.error('Error loading USDC contract address:', error_);
    }
  }

  async function fetchTierPrices() {
    try {
      const prices: Record<string, Record<string, string>> = {};
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);
      const ethSymbol = await contract.ETH();

      for (const tier of SPONSORSHIP_TIERS) {
        const ethPrice = await contract.getPrice(tier.tierId, ethSymbol);
        const usdcPrice = await contract.getPrice(tier.tierId, USDC_SYMBOL);
        prices[tier.key] = {
          ETH: ethers.formatEther(ethPrice),
          USDC: ethers.formatUnits(usdcPrice, 6),
        };
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

      // Extract release name from metadata attributes or name
      const releaseAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Release' || attr.trait_type === 'Release Name');
      const releaseNameFromMetadata = releaseAttribute?.value || metadata.name || '';

      // Set release name if we haven't set it yet or if it's different
      if (releaseNameFromMetadata && get(releaseName) !== releaseNameFromMetadata) {
        set(releaseName, releaseNameFromMetadata);
      }

      return {
        benefits,
        currentSupply: Number(currentSupply),
        description: metadata.description || '',
        imageUrl,
        maxSupply: Number(maxSupply),
        metadataURI,
        releaseName: releaseNameFromMetadata,
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
      // Load USDC address first
      await loadUSDCAddress();

      const images: Record<string, string> = {};
      const supplies: Record<string, TierSupply> = {};
      const benefits: Record<string, TierBenefits> = {};
      for (const tier of SPONSORSHIP_TIERS) {
        const tierInfo = await fetchTierInfo(tier.tierId, tier.key);
        if (tierInfo) {
          images[tier.key] = tierInfo.imageUrl;
          supplies[tier.key] = { currentSupply: tierInfo.currentSupply, maxSupply: tierInfo.maxSupply, metadataURI: tierInfo.metadataURI };
          benefits[tier.key] = { benefits: tierInfo.benefits, description: tierInfo.description };
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

  async function approveUSDC(amount: string): Promise<TransactionResponse> {
    const contractAddress = get(usdcContractAddress);
    if (!contractAddress) {
      throw new Error('USDC contract address not available');
    }

    const signer = await getSigner();
    const usdcContract = new Contract(contractAddress, ERC20_ABI, signer);

    const amountBN = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    return usdcContract.approve(CONTRACT_ADDRESS, amountBN);
  }

  async function checkUSDCAllowance(): Promise<string> {
    const contractAddress = get(usdcContractAddress);
    if (!contractAddress) {
      throw new Error('USDC contract address not available');
    }

    const signer = await getSigner();
    const userAddress = await signer.getAddress();
    const usdcContract = new Contract(contractAddress, ERC20_ABI, signer);

    const allowance = await usdcContract.allowance(userAddress, CONTRACT_ADDRESS);
    return ethers.formatUnits(allowance, 6);
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
      const contract = new Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, signer);

      let tx: TransactionResponse;

      if (currency === 'ETH') {
        // ETH payment
        const ethSymbol = await contract.ETH();
        tx = await contract.mint(tierId, ethSymbol, {
          value: ethers.parseEther(price),
        });
      }
      else if (currency === 'USDC') {
        // USDC payment - check approval first
        const allowance = await checkUSDCAllowance();
        if (parseFloat(allowance) < parseFloat(price)) {
          throw new Error(`Insufficient USDC allowance. Please approve ${price} USDC first.`);
        }

        tx = await contract.mint(tierId, USDC_SYMBOL, {
          value: 0, // No ETH for token payments
        });
      }
      else {
        throw new Error(`Unsupported currency: ${currency}`);
      }

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

  return {
    // Connection state and methods
    ...connectionMethods,
    approveUSDC,
    blockExplorerUrl,
    checkUSDCAllowance,
    connected,
    error: readonly(error),
    fetchTierPrices,
    getPaymentTokenAddress,
    isExpectedChain,
    isLoading: readonly(isLoading),
    isTierAvailable,
    loadNFTImages,
    loadUSDCAddress,
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
