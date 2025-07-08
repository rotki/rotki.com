import { get, set } from '@vueuse/core';
import { Contract, ethers, type Signer, type TransactionResponse } from 'ethers';
import { checkPaymentTokenEnabled, fetchTierPrices, refreshSupplyData } from '~/composables/rotki-sponsorship/contract';
import { CURRENCY_OPTIONS, type SponsorshipState } from '~/composables/rotki-sponsorship/types';
import { findTierById } from '~/composables/rotki-sponsorship/utils';
import { useLogger } from '~/utils/use-logger';
import { CHAIN_ID, CONTRACT_ADDRESS, ERC20_ABI, ETH_ADDRESS, ROTKI_SPONSORSHIP_ABI, USDC_ADDRESS } from './constants';

async function approveUSDC(amount: string, signer: Signer): Promise<TransactionResponse> {
  const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const amountBN = ethers.parseUnits(amount, 6); // USDC has 6 decimals
  return usdcContract.approve(CONTRACT_ADDRESS, amountBN);
}

async function checkUSDCAllowance(signer: Signer): Promise<string> {
  const userAddress = await signer.getAddress();
  const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);

  const allowance = await usdcContract.allowance(userAddress, CONTRACT_ADDRESS);
  return ethers.formatUnits(allowance, 6);
}

async function mintNFT(
  tierId: number,
  currency: string,
  price: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const contract = new Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, signer);

  let tx: TransactionResponse;

  if (currency === 'ETH') {
    // ETH payment
    tx = await contract.mint(tierId, ETH_ADDRESS, {
      value: ethers.parseEther(price),
    });
  }
  else if (currency === 'USDC') {
    // USDC payment - check approval first
    const allowance = await checkUSDCAllowance(signer);
    if (parseFloat(allowance) < parseFloat(price)) {
      throw new Error(`Insufficient USDC allowance. Please approve ${price} USDC first.`);
    }

    tx = await contract.mint(tierId, USDC_ADDRESS, {
      value: 0, // No ETH for token payments
    });
  }
  else {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return tx;
}

export function useRotkiSponsorshipPayment() {
  const sponsorshipState = ref<SponsorshipState>({ status: 'idle' });
  const selectedCurrency = ref<string>('ETH');
  const isLoading = ref(true);
  const error = ref<string | null>(null);
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

  const transactionUrl = computed(() => {
    const state = get(sponsorshipState);
    const network = getNetwork(CHAIN_ID);
    const explorerUrl = network.blockExplorers?.default.url;

    if (state.txHash && explorerUrl) {
      return `${explorerUrl}/tx/${state.txHash}`;
    }

    return null;
  });

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

  async function mintSponsorshipNFT(tierId: number, currency = 'ETH'): Promise<void> {
    if (get(sponsorshipState).status === 'pending') {
      throw new Error('Minting already in progress');
    }

    set(sponsorshipState, { status: 'pending' });

    try {
      if (!get(connected)) {
        throw new Error(t('subscription.crypto_payment.not_connected'));
      }

      // Fetch tier prices dynamically
      const prices = await fetchTierPrices();
      const supplies = await refreshSupplyData();
      const tier = findTierById(tierId);
      if (!tier) {
        throw new Error(`Invalid tier ID: ${tierId}`);
      }
      const tierKey = tier.key;
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

        // Supply data will be refreshed on next mint call
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
    checkUSDCAllowance: checkUSDCAllowanceWrapper,
    connected,
    enabledCurrencies: readonly(enabledCurrencies),
    error: readonly(error),
    isExpectedChain,
    isLoading: readonly(isLoading),
    loadEnabledCurrencies,
    mintSponsorshipNFT,
    selectedCurrency,
    sponsorshipState: readonly(sponsorshipState),
    transactionUrl,
  };
}
