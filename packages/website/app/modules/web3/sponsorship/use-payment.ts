import type { Hash, Log } from 'viem';
import type { ContractRef } from '~/modules/web3/sponsorship/actions';
import { useLocalStorage } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { pipe, ResultAsync as RA } from 'plainfp';
import { fromZod } from 'plainfp/interop/zod';
import { err, flatMap, fromNullable, fromThrowable, getOr, map, ok, type Result } from 'plainfp/result';
import { getWeb3Client } from '~/modules/web3/client';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { useWalletPicker } from '~/modules/web3/composables/use-wallet-picker';
import { blockExplorerTxUrl } from '~/modules/web3/core/chains';
import { isNativeToken } from '~/modules/web3/core/erc20';
import { fromCause, notConnected, validation, type Web3Error, web3ErrorKey } from '~/modules/web3/core/errors';
import { getSponsorshipClient, type SponsorshipClient } from '~/modules/web3/sponsorship/client';
import {
  type PaymentToken,
  type SponsorshipState,
  type StoredNft,
  StoredNftArraySchema,
  type TierKey,
  type TierSupply,
} from '~/modules/web3/sponsorship/types';
import { usePaymentTokens } from '~/modules/web3/sponsorship/use-payment-tokens';
import { findTierById } from '~/modules/web3/sponsorship/utils';
import { toTitleCase } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './use-nft-config';

/** Validate persisted NFT ids through Zod; malformed/legacy data reads as empty. */
const parseStoredNfts = fromZod(StoredNftArraySchema);

export function useRotkiSponsorshipPayment() {
  const sponsorshipState = ref<SponsorshipState>({ status: 'idle' });
  const modelCurrency = shallowRef<string>('ETH');
  const isLoadingPaymentTokens = shallowRef<boolean>(true);
  const error = ref<string>();

  const logger = useLogger('rotki-sponsorship');
  const { t } = useI18n({ useScope: 'global' });
  const { fetchPaymentTokens, getPriceForTier, getTokenBySymbol, paymentTokens } = usePaymentTokens();
  const { CHAIN_ID, CONTRACT_ADDRESS } = useNftConfig();

  const wallet = useWallet();
  const { open } = useWalletPicker();
  const { address, connected, ensureInitialized, restoreIfPersisted } = wallet;

  const storedNftIds = useLocalStorage<StoredNft[]>('rotki-sponsor-nft-ids', [], {
    serializer: {
      read: (v: string): StoredNft[] => v
        ? pipe(
            fromThrowable(() => JSON.parse(v)),
            flatMap(parseStoredNfts),
            getOr<StoredNft[]>([]),
          )
        : [],
      write: (v: StoredNft[]): string => JSON.stringify(v),
    },
  });

  // Reset transient UI state when the wallet disconnects.
  watch(connected, (isConnected) => {
    if (!isConnected)
      set(sponsorshipState, { status: 'idle' });
  });

  const isExpectedChain = computed<boolean>(() => wallet.isExpectedChain(get(CHAIN_ID)));

  const transactionUrl = computed<string | undefined>(() => {
    const state = get(sponsorshipState);
    return state.txHash ? blockExplorerTxUrl(get(CHAIN_ID), state.txHash) : undefined;
  });

  async function loadPaymentTokens(): Promise<void> {
    try {
      logger.info('Loading payment tokens...');
      set(isLoadingPaymentTokens, true);
      await fetchPaymentTokens();

      const tokens = get(paymentTokens);
      logger.info(`Loaded ${tokens.length} payment tokens`);

      const selectedToken = getTokenBySymbol(get(modelCurrency));
      const firstToken = tokens[0];
      if (!selectedToken && firstToken) {
        set(modelCurrency, firstToken.symbol);
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

  /** Record the failure in `sponsorshipState` (localized) and return it as a `Result`. */
  function failMint(web3Error: Web3Error): Result<void, Web3Error> {
    logger.error('Minting failed:', web3Error.cause ?? web3Error.message);
    set(sponsorshipState, { error: t(web3ErrorKey(web3Error), { message: web3Error.message }), status: 'error' });
    return err(web3Error);
  }

  interface MintInputs {
    token: PaymentToken;
    tierKey: TierKey;
    price: string;
  }

  /**
   * Pure pre-flight validation: resolve the payment token, tier and tier price,
   * short-circuiting to a `Validation` error on the first missing piece.
   */
  function resolveMintInputs(currency: string, tierId: number): Result<MintInputs, Web3Error> {
    return flatMap(
      fromNullable(getTokenBySymbol(currency), validation(`Payment token ${currency} not available`)),
      token => flatMap(
        fromNullable(findTierById(tierId), validation(`Invalid tier ID: ${tierId}`)),
        tier => map(
          fromNullable(token.prices[tier.key], validation(`Price not available for ${tier.key} tier in ${currency}`)),
          price => ({ price, tierKey: tier.key, token }),
        ),
      ),
    );
  }

  /** Ensure the tier exists in the supply map and is not sold out. */
  function ensureTierAvailable(supplies: Partial<Record<TierKey, TierSupply>>, tierKey: TierKey): Result<TierSupply, Web3Error> {
    return flatMap(
      fromNullable(supplies[tierKey], validation('Supply information not available for this tier')),
      supply => supply.maxSupply > 0 && supply.currentSupply >= supply.maxSupply
        ? err(validation(`${toTitleCase(tierKey)} tier is sold out`))
        : ok(supply),
    );
  }

  /**
   * Resolve the release id (explicit or read from the contract) and verify the
   * tier still has supply, returning the release id on success.
   */
  async function verifyTierForMint(sponsor: SponsorshipClient, ref: ContractRef, tierKey: TierKey, explicitReleaseId: number | undefined): Promise<Result<bigint, Web3Error>> {
    const releaseIdResult: Result<bigint, Web3Error> = explicitReleaseId !== undefined
      ? ok(BigInt(explicitReleaseId))
      : await sponsor.readCurrentReleaseId(ref);
    if (!releaseIdResult.ok)
      return releaseIdResult;

    const releaseId = releaseIdResult.value;
    const supplies = await sponsor.readTierSupplies(ref, releaseId);
    return map(flatMap(supplies, tierSupplies => ensureTierAvailable(tierSupplies, tierKey)), () => releaseId);
  }

  /** Persist a freshly minted NFT id for the connected address (deduplicated). */
  function persistMintedNft(tokenId: string, minter: string, releaseId: bigint, tierId: number): void {
    const numericId = Number.parseInt(tokenId);
    const currentAddress = minter.toLowerCase();
    const stored = get(storedNftIds);
    if (stored && !stored.some(nft => nft.id === numericId && nft.address.toLowerCase() === currentAddress)) {
      set(storedNftIds, [...stored, { address: currentAddress, id: numericId, releaseId: Number(releaseId), tier: tierId }]);
    }
  }

  /** Decode the minted token id from the receipt, mark success and persist it. */
  function finalizeMint(sponsor: SponsorshipClient, logs: readonly Log[], hash: Hash, releaseId: bigint, tierId: number): void {
    const minter = get(address);
    const tokenId = minter ? sponsor.decodeMintedTokenId(logs, minter) : undefined;
    set(sponsorshipState, { status: 'success', tokenId, txHash: hash });
    if (tokenId && minter)
      persistMintedNft(tokenId, minter, releaseId, tierId);
  }

  async function mintSponsorshipNFT(tierId: number, currency = 'ETH', releaseId?: number): Promise<Result<void, Web3Error>> {
    if (get(sponsorshipState).status === 'pending')
      return err(validation('Minting already in progress'));

    set(sponsorshipState, { status: 'pending' });

    try {
      if (!get(connected))
        return failMint(notConnected());

      const inputs = resolveMintInputs(currency, tierId);
      if (!inputs.ok)
        return failMint(inputs.error);
      const { price, tierKey, token } = inputs.value;

      const [client, sponsor] = await Promise.all([
        getWeb3Client(ensureInitialized),
        getSponsorshipClient(ensureInitialized),
      ]);

      const chainId = get(CHAIN_ID);
      const contractAddress = get(CONTRACT_ADDRESS);
      const ref = { chainId, contractAddress };

      const verified = await verifyTierForMint(sponsor, ref, tierKey, releaseId);
      if (!verified.ok)
        return failMint(verified.error);
      const currentReleaseId = verified.value;

      const mintResult = await sponsor.mintNft({
        chainId,
        contractAddress,
        decimals: token.decimals,
        isNative: isNativeToken(token.address),
        paymentToken: token.address,
        price,
        tierId,
      });
      if (!mintResult.ok)
        return failMint(mintResult.error);

      const hash = mintResult.value;
      set(sponsorshipState, { status: 'pending', txHash: hash });

      const receiptResult = await client.waitForReceipt(hash, chainId);
      if (!receiptResult.ok)
        return failMint(receiptResult.error);
      if (receiptResult.value.status !== 'success')
        return failMint(fromCause(new Error('Transaction failed')));

      finalizeMint(sponsor, receiptResult.value.logs, hash, currentReleaseId, tierId);
      return ok(undefined);
    }
    catch (error_) {
      return failMint(fromCause(error_));
    }
  }

  async function approveToken(currency: string, amount: string, unlimited = true): Promise<Result<Hash, Web3Error>> {
    const token = getTokenBySymbol(currency);
    if (!token || isNativeToken(token.address))
      return err(validation('Cannot approve ETH or invalid token'));

    const client = await getWeb3Client(ensureInitialized);
    const chainId = get(CHAIN_ID);

    // Approve, then wait for confirmation so the allowance is effective when we
    // return — surfacing the approval hash to the caller, not the receipt.
    return pipe(
      client.approveErc20({
        amount,
        chainId,
        decimals: token.decimals,
        spender: get(CONTRACT_ADDRESS),
        token: token.address,
        unlimited,
      }),
      RA.flatMap(async hash => pipe(
        client.waitForReceipt(hash, chainId),
        RA.map(() => hash),
      )),
    );
  }

  async function checkTokenAllowance(currency: string): Promise<string> {
    const token = getTokenBySymbol(currency);
    const owner = get(address);
    if (!token || isNativeToken(token.address) || !owner) {
      return '0';
    }

    const client = await getWeb3Client(ensureInitialized);
    const result = await client.readErc20Allowance({
      chainId: get(CHAIN_ID),
      decimals: token.decimals,
      owner,
      spender: get(CONTRACT_ADDRESS),
      token: token.address,
    });
    return getOr(result, '0');
  }

  /**
   * Estimated network fee (native coin, human-readable) for minting `tierId` with
   * `currency`. Reuses the `resolveMintInputs` validation chain; returns '' when
   * inputs aren't resolvable yet so the funds check stays neutral. Drives the soft
   * gas warning only — never blocks minting.
   */
  async function estimateMintFee(currency: string, tierId: number): Promise<string> {
    const inputs = resolveMintInputs(currency, tierId);
    const owner = get(address);
    if (!inputs.ok || !owner)
      return '';

    const { price, token } = inputs.value;
    const sponsor = await getSponsorshipClient(ensureInitialized);
    const result = await sponsor.estimateMintFee({
      account: owner,
      chainId: get(CHAIN_ID),
      contractAddress: get(CONTRACT_ADDRESS),
      decimals: token.decimals,
      isNative: isNativeToken(token.address),
      paymentToken: token.address,
      price,
      tierId,
    });
    return getOr(result, '');
  }

  async function switchNetwork(): Promise<Result<void, Web3Error>> {
    const result = await wallet.switchChain(get(CHAIN_ID));
    if (!result.ok)
      set(sponsorshipState, { error: t(web3ErrorKey(result.error), { message: result.error.message }), status: 'error' });
    return result;
  }

  function resetSponsorshipState(): void {
    set(sponsorshipState, { status: 'idle' });
  }

  const currentAddressNfts = computed<StoredNft[]>(() => {
    const currentAddress = get(address);
    if (!currentAddress)
      return [];

    return (get(storedNftIds) ?? [])
      .filter(nft => nft.address.toLowerCase() === currentAddress.toLowerCase());
  });

  return {
    address,
    approveToken,
    chainId: CHAIN_ID,
    checkTokenAllowance,
    connected,
    currentAddressNfts,
    error: shallowReadonly(error),
    estimateMintFee,
    getPriceForTier,
    isExpectedChain,
    isLoadingPaymentTokens: shallowReadonly(isLoadingPaymentTokens),
    loadPaymentTokens,
    mintSponsorshipNFT,
    modelCurrency,
    open,
    paymentTokens,
    resetSponsorshipState,
    restoreIfPersisted,
    sponsorshipState: shallowReadonly(sponsorshipState),
    storedNftIds: shallowReadonly(storedNftIds),
    switchNetwork,
    transactionUrl,
  };
}
