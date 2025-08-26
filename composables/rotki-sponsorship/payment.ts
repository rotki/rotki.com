import { get, set, useLocalStorage } from '@vueuse/core';
import { Contract, ethers, type Signer, type TransactionResponse } from 'ethers';
import { refreshSupplyData } from '~/composables/rotki-sponsorship/contract';
import {
  type SponsorshipState,
  StoredNft,
  StoredNftArraySchema,
} from '~/composables/rotki-sponsorship/types';
import { usePaymentTokens } from '~/composables/rotki-sponsorship/use-payment-tokens';
import { findTierById } from '~/composables/rotki-sponsorship/utils';
import { createTimeoutPromise } from '~/utils/timeout';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { ERC20_ABI, ETH_ADDRESS, ROTKI_SPONSORSHIP_ABI } from './constants';

const TRANSACTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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

  const storedNftIds = useLocalStorage<StoredNft[]>('rotki-sponsor-nft-ids', [], {
    serializer: {
      read: (v: string) => {
        if (!v)
          return [];
        try {
          const parsed = JSON.parse(v);
          const result = StoredNftArraySchema.safeParse(parsed);
          if (result.success) {
            return result.data;
          }
          // Fallback for legacy data format with defaults
          return parsed.map((n: any) => StoredNft.parse(n));
        }
        catch { return []; }
      },
      write: (v: StoredNft[]) => JSON.stringify(v),
    },
  });

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

  async function mintSponsorshipNFT(tierId: number, currency = 'ETH', releaseId?: number): Promise<void> {
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

      // Get supply info and release ID using user's provider if connected
      const provider = get(connected) ? getBrowserProvider() : undefined;
      const { CONTRACT_ADDRESS, RPC_URL } = useNftConfig();
      const ethersProvider = provider || new ethers.JsonRpcProvider(get(RPC_URL));
      const contract = new ethers.Contract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, ethersProvider);
      const currentReleaseId = releaseId || await contract.currentReleaseId();
      const supplies = await refreshSupplyData(provider);
      const supply = supplies[tierKey];
      if (!supply) {
        throw new Error('Supply information not available for this tier');
      }

      // Check if tier is sold out (maxSupply = 0 means unlimited)
      if (supply.maxSupply > 0 && supply.currentSupply >= supply.maxSupply) {
        throw new Error(`${toTitleCase(tierKey)} tier is sold out`);
      }

      const signer = await getSigner();
      const tx = await mintNFT(tierId, token.address, price, token.decimals, signer);

      set(sponsorshipState, {
        status: 'pending',
        txHash: tx.hash,
      });

      // Create a timeout promise (5 minutes)
      const timeoutPromise = createTimeoutPromise(TRANSACTION_TIMEOUT, (_, reject) => {
        reject(new Error('Transaction timeout - please check your wallet for the transaction status'));
      });

      // Wait for transaction confirmation with timeout
      let receipt;
      try {
        receipt = await Promise.race([
          tx.wait(),
          timeoutPromise,
        ]);
      }
      catch (waitError: any) {
        // Check if transaction was replaced/cancelled
        if (waitError.code === 'TRANSACTION_REPLACED') {
          if (waitError.replacement && waitError.replacement.hash === waitError.replacement.to) {
            // Transaction was cancelled (replacement tx sent to self)
            throw new Error('Transaction was cancelled');
          }
          else if (waitError.replacement) {
            // Transaction was replaced with a different one (speed up)
            // Try to wait for the replacement transaction
            try {
              receipt = await waitError.replacement.wait();
            }
            catch {
              throw new Error('Transaction was replaced but failed to confirm');
            }
          }
          else {
            throw new Error('Transaction was replaced or cancelled');
          }
        }
        else {
          // Re-throw other errors (including timeout)
          throw waitError;
        }
      }

      if (receipt?.status === 1) {
        // Parse the NFTMinted event to get the token ID
        let tokenId: string | undefined;

        const { CONTRACT_ADDRESS: contractAddress } = useNftConfig();
        const contract = new Contract(get(contractAddress), ROTKI_SPONSORSHIP_ABI, signer);

        // Find the NFTMinted event in the receipt logs
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              data: log.data,
              topics: log.topics as string[],
            });

            if (parsedLog?.name === 'NFTMinted' && parsedLog.args.minter.toLowerCase() === get(address)?.toLowerCase()) {
              tokenId = parsedLog.args.tokenId.toString();
              break;
            }
          }
          catch {
            // Skip logs that don't match our event
          }
        }

        set(sponsorshipState, {
          status: 'success',
          tokenId,
          txHash: tx.hash,
        });

        // Store NFT ID with address, tier, and release ID in localStorage
        if (tokenId && get(address)) {
          const numericId = parseInt(tokenId);
          const currentAddress = get(address)!.toLowerCase();
          const stored = get(storedNftIds);

          // Check if this NFT ID is already stored for this address
          if (!stored.some(nft => nft.id === numericId && nft.address.toLowerCase() === currentAddress)) {
            set(storedNftIds, [...stored, {
              address: currentAddress,
              id: numericId,
              releaseId: Number(currentReleaseId),
              tier: tierId,
            }]);
          }
        }

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

  async function checkTransactionStatus(txHash: string) {
    try {
      const provider = getBrowserProvider();
      const receipt = await provider.getTransactionReceipt(txHash);

      if (receipt) {
        const status = receipt.status === 1 ? 'success' : 'failed';
        return { receipt, status };
      }
      else {
        // Transaction is still pending or doesn't exist
        const tx = await provider.getTransaction(txHash);
        if (tx) {
          return { status: 'pending', transaction: tx };
        }
        else {
          return { status: 'not_found' };
        }
      }
    }
    catch (error) {
      logger.error('Failed to check transaction status:', error);
      return { error, status: 'error' };
    }
  }

  // Computed property to get NFT IDs for the current connected address
  const currentAddressNfts = computed<StoredNft[]>(() => {
    const currentAddress = get(address);
    if (!currentAddress)
      return [];

    return get(storedNftIds)
      .filter(nft => nft.address.toLowerCase() === currentAddress.toLowerCase());
  });

  return {
    // Connection state and methods
    ...connectionMethods,
    address,
    approveToken,
    checkTokenAllowance,
    checkTransactionStatus,
    connected,
    currentAddressNfts: readonly(currentAddressNfts),
    error: readonly(error),
    getPriceForTier,
    isExpectedChain,
    isLoadingPaymentTokens: readonly(isLoadingPaymentTokens),
    loadPaymentTokens,
    mintSponsorshipNFT,
    paymentTokens,
    selectedCurrency,
    sponsorshipState: readonly(sponsorshipState),
    storedNftIds: readonly(storedNftIds),
    transactionUrl,
  };
}
