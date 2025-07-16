import type { SponsorshipState } from '~/composables/rotki-sponsorship/types';
import { get, set } from '@vueuse/core';
import { Contract, ethers, type Signer, type TransactionResponse } from 'ethers';
import { refreshSupplyData } from '~/composables/rotki-sponsorship/contract';
import { usePaymentTokens } from '~/composables/rotki-sponsorship/use-payment-tokens';
import { findTierById } from '~/composables/rotki-sponsorship/utils';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { ERC20_ABI, ETH_ADDRESS, ROTKI_SPONSORSHIP_ABI } from './constants';

async function approveTokenContract(tokenAddress: string, amount: string, decimals: number, signer: Signer): Promise<TransactionResponse> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
  const amountBN = ethers.parseUnits(amount, decimals);
  return tokenContract.approve(get(CONTRACT_ADDRESS), amountBN);
}

async function checkTokenAllowanceContract(tokenAddress: string, decimals: number, signer: Signer): Promise<string> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const userAddress = await signer.getAddress();
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

  const allowance = await tokenContract.allowance(userAddress, get(CONTRACT_ADDRESS));
  return ethers.formatUnits(allowance, decimals);
}

async function mintNFT(
  tierId: number,
  tokenAddress: string,
  price: string,
  decimals: number,
  signer: Signer,
): Promise<TransactionResponse> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const contract = new Contract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, signer);

  let tx: TransactionResponse;

  if (tokenAddress === ETH_ADDRESS) {
    // ETH payment
    tx = await contract.mint(tierId, ETH_ADDRESS, {
      value: ethers.parseEther(price),
    });
  }
  else {
    // Token payment - check approval first
    const allowance = await checkTokenAllowanceContract(tokenAddress, decimals, signer);
    if (parseFloat(allowance) < parseFloat(price)) {
      throw new Error(`Insufficient token allowance. Please approve ${price} tokens first.`);
    }

    tx = await contract.mint(tierId, tokenAddress, {
      value: 0, // No ETH for token payments
    });
  }

  return tx;
}

export function useRotkiSponsorshipPayment() {
  const sponsorshipState = ref<SponsorshipState>({ status: 'idle' });
  const selectedCurrency = ref<string>('ETH');
  const isLoadingPaymentTokens = ref<boolean>(true);
  const error = ref<string>();

  const logger = useLogger('rotki-sponsorship');
  const { t } = useI18n({ useScope: 'global' });
  const { fetchPaymentTokens, getPriceForTier, getTokenBySymbol, paymentTokens } = usePaymentTokens();
  const { CHAIN_ID } = useNftConfig();

  const connection = useWeb3Connection({
    chainId: get(CHAIN_ID),
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
    address,
    connected,
    getBrowserProvider,
    getNetwork,
    getSigner,
    isExpectedChain,
    ...connectionMethods
  } = connection;

  const transactionUrl = computed(() => {
    const state = get(sponsorshipState);
    const network = getNetwork(get(CHAIN_ID));
    const explorerUrl = network.blockExplorers?.default.url;

    if (state.txHash && explorerUrl) {
      return `${explorerUrl}/tx/${state.txHash}`;
    }

    return null;
  });

  async function loadPaymentTokens() {
    try {
      logger.info('Loading payment tokens...');
      set(isLoadingPaymentTokens, true);
      await fetchPaymentTokens();

      const tokens = get(paymentTokens);
      logger.info(`Loaded ${tokens.length} payment tokens`);

      // If selected currency is not available, switch to ETH
      const selectedToken = get(getTokenBySymbol)(get(selectedCurrency));
      if (!selectedToken && tokens.length > 0) {
        set(selectedCurrency, tokens[0].symbol);
      }
    }
    catch (error_) {
      logger.error('Error loading payment tokens:', error_);
      set(error, 'Failed to load payment options');
    }
    finally {
      set(isLoadingPaymentTokens, false);
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

      // Get payment token info
      const token = get(getTokenBySymbol)(currency);
      if (!token) {
        throw new Error(`Payment token ${currency} not available`);
      }

      // Get tier info
      const tier = findTierById(tierId);
      if (!tier) {
        throw new Error(`Invalid tier ID: ${tierId}`);
      }
      const tierKey = tier.key;

      // Get price from payment token
      const price = token.prices[tierKey];
      if (!price) {
        throw new Error(`Price not available for ${tierKey} tier in ${currency}`);
      }

      // Get supply info using user's provider if connected
      const provider = get(connected) ? getBrowserProvider() : undefined;
      const supplies = await refreshSupplyData(provider);
      const supply = supplies[tierKey];
      if (!supply) {
        throw new Error('Supply information not available for this tier');
      }

      // Check if tier is sold out (maxSupply = 0 means unlimited)
      if (supply.maxSupply > 0 && supply.currentSupply >= supply.maxSupply) {
        throw new Error(`${tierKey.charAt(0).toUpperCase() + tierKey.slice(1)} tier is sold out`);
      }

      const signer = await getSigner();
      const tx = await mintNFT(tierId, token.address, price, token.decimals, signer);

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

  async function approveToken(currency: string, amount: string) {
    const token = get(getTokenBySymbol)(currency);
    if (!token || token.address === ETH_ADDRESS) {
      throw new Error('Cannot approve ETH or invalid token');
    }

    const signer = await getSigner();
    return approveTokenContract(token.address, amount, token.decimals, signer);
  }

  async function checkTokenAllowance(currency: string) {
    const token = get(getTokenBySymbol)(currency);
    if (!token || token.address === ETH_ADDRESS) {
      return '0';
    }

    const signer = await getSigner();
    return checkTokenAllowanceContract(token.address, token.decimals, signer);
  }

  return {
    // Connection state and methods
    ...connectionMethods,
    address,
    approveToken,
    checkTokenAllowance,
    connected,
    error: readonly(error),
    getPriceForTier,
    isExpectedChain,
    isLoadingPaymentTokens: readonly(isLoadingPaymentTokens),
    loadPaymentTokens,
    mintSponsorshipNFT,
    paymentTokens,
    selectedCurrency,
    sponsorshipState: readonly(sponsorshipState),
    transactionUrl,
  };
}
