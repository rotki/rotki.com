import type { PaymentToken, SponsorshipTier, TierKey, TierSupply } from '~/modules/web3/sponsorship/types';
import { watchDebounced } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type BalanceToken, useTokenBalance } from '~/modules/web3/composables/use-token-balance';
import { isNativeToken } from '~/modules/web3/core/erc20';
import {
  buildTierPriceDisplay,
  computeNeedsApproval,
  filterAvailableTokens,
  filterVisibleTiers,
  type MintButtonState,
  resolveApprovalRequest,
  resolveMintButtonState,
} from '~/modules/web3/sponsorship/mint-state';
import { useRotkiSponsorshipPayment } from '~/modules/web3/sponsorship/use-payment';
import { useSponsorshipData } from '~/modules/web3/sponsorship/use-sponsorship';
import { useSponsorshipFeature } from '~/modules/web3/sponsorship/use-sponsorship-feature';
import { findTierByKey, isTierAvailable } from '~/modules/web3/sponsorship/utils';
import { useSponsorshipMetadataStore } from '~/store/sponsorship-metadata';
import { useLogger } from '~/utils/use-logger';

const APPROVAL_TYPE = { EXACT: 'exact', UNLIMITED: 'unlimited' } as const;

export type ApprovalType = typeof APPROVAL_TYPE[keyof typeof APPROVAL_TYPE];

interface TierContent {
  benefits: string;
  example: string[];
}

/**
 * Orchestrates the sponsorship mint page: tier/currency selection, allowance and
 * approval handling, the mint transaction and the post-mint success flow. All
 * branchy derivations delegate to the pure helpers in `mint-state.ts`, keeping
 * this layer thin reactive glue.
 */
export function useMintFlow() {
  const modelSelectedTier = shallowRef<TierKey>('bronze');
  const isApproving = shallowRef<boolean>(false);
  const tokenAllowance = shallowRef<string>('0');
  const modelShowSuccessDialog = shallowRef<boolean>(false);

  const { t } = useI18n({ useScope: 'global' });
  const logger = useLogger('mint-flow');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { configReady, isEnabled: isMintingEnabled } = useSponsorshipFeature();

  const sponsorshipMetadataStore = useSponsorshipMetadataStore();
  const { error: metadataError } = storeToRefs(sponsorshipMetadataStore);
  const { fetchMetadata } = sponsorshipMetadataStore;

  const {
    address,
    approveToken,
    chainId,
    checkTokenAllowance,
    connected,
    estimateMintFee,
    getPriceForTier,
    isExpectedChain,
    isLoadingPaymentTokens,
    loadPaymentTokens,
    mintSponsorshipNFT,
    modelCurrency,
    open,
    paymentTokens,
    resetSponsorshipState,
    restoreIfPersisted,
    sponsorshipState,
    switchNetwork,
    transactionUrl,
  } = useRotkiSponsorshipPayment();

  const { data: sponsorshipData, error: dataError, pending: isLoading, refresh: refreshSponsorshipData } = useSponsorshipData();

  // Sponsorship tier marketing content (benefits / examples) from @nuxt/content.
  const { data: sponsorshipTiers } = useAsyncData('sponsorship-tiers', async () => queryCollection('sponsorshipTiers').all(), { dedupe: 'defer' });

  const tierContent = computed<Record<string, TierContent>>(() => {
    const tiers = get(sponsorshipTiers);
    if (!tiers)
      return {};

    const result: Record<string, TierContent> = {};
    for (const item of tiers)
      result[item.tier] = { benefits: item.benefits, example: item.example || [] };
    return result;
  });

  const nftImages = computed<Record<string, string>>(() => get(sponsorshipData)?.nftImages || {});
  const tierSupply = computed<Record<string, TierSupply>>(() => get(sponsorshipData)?.tierSupply || {});
  const releaseId = computed<number | undefined>(() => get(sponsorshipData)?.releaseId);
  const releaseName = computed<string>(() => get(sponsorshipData)?.releaseName || '');
  const error = computed<string | undefined>(() => get(sponsorshipData)?.error);

  const availableTokens = computed<PaymentToken[]>(() => filterAvailableTokens(get(paymentTokens)));

  const visibleTiers = computed<SponsorshipTier[]>(() => filterVisibleTiers(get(modelCurrency), getPriceForTier, get(isLoadingPaymentTokens)));

  const tierPriceDisplay = computed<Record<string, string>>(() =>
    buildTierPriceDisplay(get(modelCurrency), getPriceForTier, get(isLoadingPaymentTokens), t('sponsor.sponsor_page.pricing.loading')));

  const needsApproval = computed<boolean>(() => computeNeedsApproval({
    allowance: get(tokenAllowance),
    isExpectedChain: get(isExpectedChain),
    tierKey: get(modelSelectedTier),
    token: get(paymentTokens).find(token => token.symbol === get(modelCurrency)),
  }));

  // Selected payment token (address + decimals) and its current tier price, for the balance check.
  const selectedToken = computed<BalanceToken | undefined>(() => {
    const token = get(paymentTokens).find(item => item.symbol === get(modelCurrency));
    return token ? { address: token.address, decimals: token.decimals } : undefined;
  });

  const currentPrice = computed<string>(() => getPriceForTier(get(modelCurrency), get(modelSelectedTier)) ?? '');

  const balanceActive = computed<boolean>(() => get(connected) && get(isExpectedChain));

  const { estimatedGas, fundsStatus, loading: isLoadingBalance, nativeBalance, refresh: refreshBalances, tokenBalance } = useTokenBalance({
    active: balanceActive,
    chainId,
    estimateGas: async () => estimateMintFee(get(modelCurrency), findTierByKey(get(modelSelectedTier))?.tierId ?? 0),
    price: currentPrice,
    token: selectedToken,
  });

  const buttonState = computed<MintButtonState>(() => resolveMintButtonState({
    connected: get(connected),
    currency: get(modelCurrency),
    hasInsufficientFunds: get(fundsStatus).tokenShortfall,
    hasVisibleTiers: get(visibleTiers).length > 0,
    isApproving: get(isApproving),
    isExpectedChain: get(isExpectedChain),
    isPending: get(sponsorshipState).status === 'pending',
    mintingEnabled: get(isMintingEnabled),
    needsApproval: get(needsApproval),
    tier: findTierByKey(get(modelSelectedTier)),
    tierAvailable: isTierAvailable(get(modelSelectedTier), get(tierSupply)),
  }));

  const buttonText = computed<string>(() => {
    const { textKey, textParams } = get(buttonState);
    return t(textKey, textParams ?? {});
  });

  const buttonAction = computed<() => void | Promise<void>>(() => {
    switch (get(buttonState).action) {
      case 'connect':
        return open;
      case 'switch-network':
        return async () => switchNetwork();
      case 'mint':
        return handleMint;
      case 'none':
        return () => {};
    }
  });

  const isButtonDisabled = computed<boolean>(() => get(buttonState).disabled);

  async function handleApprove(selectedApprovalType: ApprovalType): Promise<void> {
    try {
      set(isApproving, true);
      const request = resolveApprovalRequest(get(modelCurrency), get(modelSelectedTier), get(paymentTokens));
      if (!request.ok)
        return;

      const { currency, price } = request.value;
      const isUnlimited = selectedApprovalType === APPROVAL_TYPE.UNLIMITED;
      // approveToken resolves only after the approval tx is confirmed.
      const result = await approveToken(currency, price, isUnlimited);
      if (!result.ok)
        logger.error('Approval failed:', result.error);

      // Always re-read the allowance: even a timed-out approval may have confirmed
      // on-chain, so refresh rather than leaving the UI showing "approve needed".
      set(tokenAllowance, await checkTokenAllowance(currency));
    }
    finally {
      set(isApproving, false);
    }
  }

  async function handleMint(): Promise<void> {
    const tier = findTierByKey(get(modelSelectedTier));
    if (!tier)
      return;

    const result = await mintSponsorshipNFT(tier.tierId, get(modelCurrency), get(releaseId));
    if (!result.ok) {
      logger.error('Minting failed:', result.error);
      await refreshSponsorshipData();
    }
  }

  async function checkAllowanceIfNeeded(): Promise<void> {
    if (!get(isExpectedChain))
      return;

    const currency = get(modelCurrency);
    const token = get(paymentTokens).find(item => item.symbol === currency);
    if (token && !isNativeToken(token.address) && get(connected)) {
      try {
        set(tokenAllowance, await checkTokenAllowance(currency));
      }
      catch (error_) {
        logger.error('Failed to check token allowance:', error_);
      }
    }
  }

  // Notify the backend to monitor the mint transaction (best-effort).
  async function onMintingSuccess(txHash: string): Promise<void> {
    try {
      await fetchWithCsrf('/webapi/nfts/monitor-tx/', { body: { txHash }, method: 'POST' });
      logger.info(`Transaction monitoring started for: ${txHash}`);
    }
    catch (error_) {
      logger.error('Failed to start transaction monitoring:', error_);
    }
  }

  // Keep the selected tier valid: if it drops out of the visible list, pick the first visible one.
  watchEffect(() => {
    const visible = get(visibleTiers);
    const firstVisible = visible[0];
    if (firstVisible && !visible.some(tier => tier.key === get(modelSelectedTier)))
      set(modelSelectedTier, firstVisible.key);
  });

  // Keep the selected currency valid against the available tokens.
  watchEffect(() => {
    const available = get(availableTokens);
    const firstAvailable = available[0];
    if (firstAvailable && !available.some(token => token.symbol === get(modelCurrency)))
      set(modelCurrency, firstAvailable.symbol);
  });

  watchDebounced([modelCurrency, connected, isExpectedChain], checkAllowanceIfNeeded, { debounce: 300 });

  // Surface the success dialog once a mint confirms, then notify the backend + refresh.
  watch(() => get(sponsorshipState).status, async (status) => {
    if (status === 'success' && get(transactionUrl)) {
      set(modelShowSuccessDialog, true);
      const { txHash } = get(sponsorshipState);
      if (txHash)
        await onMintingSuccess(txHash);
      await refreshSponsorshipData();
      // Balance dropped by the mint (+ gas) — re-read so the UI isn't stale.
      await refreshBalances();
    }
  });

  onBeforeMount(async () => {
    // Restore a persisted wallet session in the background so the page reflects
    // the connected state on load (no web3 chunk for sessionless visitors); kept
    // concurrent so it never delays the metadata/token fetch.
    const restore = restoreIfPersisted();
    await fetchMetadata();
    // Only load currencies and check allowance once metadata resolved successfully.
    if (!get(metadataError)) {
      await loadPaymentTokens();
      await checkAllowanceIfNeeded();
    }
    await restore;
  });

  return {
    address,
    availableTokens,
    buttonAction,
    buttonText,
    configReady,
    connected,
    dataError,
    error,
    estimatedGas,
    fundsStatus,
    getPriceForTier,
    handleApprove,
    isApproving: shallowReadonly(isApproving),
    isButtonDisabled,
    isLoading,
    isLoadingBalance,
    isLoadingPaymentTokens,
    isMintingEnabled,
    metadataError,
    modelCurrency,
    nativeBalance,
    needsApproval,
    nftImages,
    selectedTokenBalance: tokenBalance,
    open,
    releaseName,
    resetSponsorshipState,
    modelSelectedTier,
    modelShowSuccessDialog,
    sponsorshipState,
    tierContent,
    tierPriceDisplay,
    tierSupply,
    transactionUrl,
    visibleTiers,
  };
}
