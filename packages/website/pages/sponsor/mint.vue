<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { useSponsorshipData } from '~/composables/rotki-sponsorship';
import { ETH_ADDRESS } from '~/composables/rotki-sponsorship/constants';
import { useRotkiSponsorshipPayment } from '~/composables/rotki-sponsorship/payment';
import { SPONSORSHIP_TIERS, type TierKey } from '~/composables/rotki-sponsorship/types';
import { findTierByKey, isTierAvailable } from '~/composables/rotki-sponsorship/utils';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useSponsorshipMetadataStore } from '~/store/sponsorship-metadata';
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useLogger } from '~/utils/use-logger';

const description = 'Sponsor rotki\'s next release';

useHead({
  title: 'Sponsor | rotki',
  meta: [
    ...getMetadata('Sponsor | rotki', description, '/sponsor/mint', 'mint.png'),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'sponsor',
  middleware: 'sponsorship',
});

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();

const APPROVAL_TYPE = { UNLIMITED: 'unlimited', EXACT: 'exact' } as const;

type ApprovalType = typeof APPROVAL_TYPE[keyof typeof APPROVAL_TYPE];

const logger = useLogger();

const selectedTier = ref<TierKey>('bronze');
const isApproving = ref<boolean>(false);
const tokenAllowance = ref<string>('0');
const approvalType = ref<ApprovalType>(APPROVAL_TYPE.UNLIMITED);
const showSuccessDialog = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });
const { fetchWithCsrf } = useFetchWithCsrf();

// Fetch leaderboard metadata on mount to ensure config is available
const sponsorshipMetadataStore = useSponsorshipMetadataStore();
const { error: metadataError } = storeToRefs(sponsorshipMetadataStore);
const { fetchMetadata } = sponsorshipMetadataStore;

// Fetch sponsorship tier content
const { fallbackToLocalOnError } = useRemoteOrLocal();

const { data: sponsorshipTiers } = await useAsyncData('sponsorship-tiers', () => fallbackToLocalOnError(
  async () => await queryCollection('sponsorshipTiersRemote').all(),
  async () => await queryCollection('sponsorshipTiersLocal').all(),
));

// Convert array to object keyed by tier
const tierContent = computed(() => {
  const tiers = get(sponsorshipTiers);
  if (!tiers)
    return {};

  const result: Record<string, { benefits: string; example: string[] }> = {};
  for (const item of tiers) {
    result[item.tier] = {
      benefits: item.benefits,
      example: item.example || [],
    };
  }
  return result;
});

const {
  connected,
  address,
  isExpectedChain,
  sponsorshipState,
  transactionUrl,
  selectedCurrency,
  paymentTokens,
  getPriceForTier,
  open,
  switchNetwork,
  loadPaymentTokens,
  mintSponsorshipNFT,
  approveToken,
  checkTokenAllowance,
  isLoadingPaymentTokens,
  resetSponsorshipState,
} = useRotkiSponsorshipPayment();

const { data: sponsorshipData, pending: isLoading, refresh: refreshSponsorshipData, error: dataError } = useSponsorshipData();

const nftImages = computed(() => get(sponsorshipData)?.nftImages || {});
const tierSupply = computed(() => get(sponsorshipData)?.tierSupply || {});
const releaseId = computed(() => get(sponsorshipData)?.releaseId);
const releaseName = computed(() => get(sponsorshipData)?.releaseName || '');
const error = computed(() => get(sponsorshipData)?.error);

async function handleApprove(selectedApprovalType: ApprovalType) {
  set(approvalType, selectedApprovalType);
  try {
    set(isApproving, true);
    const tierKey = get(selectedTier);
    if (!tierKey)
      return;
    const tier = findTierByKey(tierKey);
    if (!tier)
      return;

    const currency = get(selectedCurrency);
    const token = get(paymentTokens).find(t => t.symbol === currency);
    if (!token || !token.prices)
      return;

    const price = token.prices[tier.key];
    if (!price)
      return;

    const isUnlimited = get(approvalType) === APPROVAL_TYPE.UNLIMITED;
    const tx = await approveToken(currency, price, isUnlimited);
    await tx.wait();

    // Refresh allowance after approval
    const newAllowance = await checkTokenAllowance(currency);
    set(tokenAllowance, newAllowance);
  }
  catch (error) {
    logger.error('Approval failed:', error);
  }
  finally {
    set(isApproving, false);
  }
}

async function handleMint() {
  try {
    const tierKey = get(selectedTier);
    if (!tierKey)
      return;
    const tier = findTierByKey(tierKey);
    if (!tier)
      return;

    await mintSponsorshipNFT(tier.tierId, get(selectedCurrency), get(releaseId));
  }
  catch (error) {
    logger.error('Minting failed:', error);
    await refreshSponsorshipData();
  }
}

const availableTokens = computed(() =>
  // Filter out tokens that have all zero prices for all tiers
  get(paymentTokens).filter((token) => {
    if (!token.prices)
      return false;

    // Check if at least one tier has a non-zero price
    return SPONSORSHIP_TIERS.some((tier) => {
      const price = token.prices[tier.key as TierKey];
      return price && parseFloat(price) > 0;
    });
  }),
);

const tierPriceDisplay = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  const currency = get(selectedCurrency);

  if (get(isLoadingPaymentTokens)) {
    SPONSORSHIP_TIERS.forEach((tier) => {
      result[tier.key] = t('sponsor.sponsor_page.pricing.loading');
    });
    return result;
  }

  const priceGetter = get(getPriceForTier);
  SPONSORSHIP_TIERS.forEach((tier) => {
    const price = priceGetter(currency, tier.key);
    result[tier.key] = price ? `${price} ${currency}` : '0';
  });

  return result;
});

const visibleTiers = computed(() => {
  const currency = get(selectedCurrency);
  const priceGetter = get(getPriceForTier);

  if (get(isLoadingPaymentTokens)) {
    return SPONSORSHIP_TIERS;
  }

  return SPONSORSHIP_TIERS.filter((tier) => {
    const price = priceGetter(currency, tier.key);
    return price && parseFloat(price) > 0;
  });
});

const needsApproval = computed<boolean>(() => {
  // Don't show approval if not on the expected chain
  if (!get(isExpectedChain))
    return false;

  const currency = get(selectedCurrency);
  const token = get(paymentTokens).find(t => t.symbol === currency);
  const selectedTierKey = get(selectedTier);

  if (!token || token.address === ETH_ADDRESS)
    return false;

  const price = token.prices[selectedTierKey as TierKey];
  const allowance = get(tokenAllowance);

  // Check if allowance is less than required price
  // Also check if it's not already set to max (unlimited)
  const maxAllowance = Number.MAX_SAFE_INTEGER; // Very large number to represent unlimited
  return !!(price && parseFloat(allowance) < parseFloat(price) && parseFloat(allowance) < maxAllowance);
});

const buttonText = computed(() => {
  const selectedTierKey = get(selectedTier);
  const tier = findTierByKey(selectedTierKey);
  const currency = get(selectedCurrency);
  const visible = get(visibleTiers);

  if (!get(connected))
    return t('sponsor.sponsor_page.buttons.connect_wallet');
  if (!get(isExpectedChain))
    return t('sponsor.sponsor_page.buttons.switch_network');
  if (visible.length === 0)
    return t('sponsor.sponsor_page.buttons.no_tiers_available');
  if (!tier)
    return t('sponsor.sponsor_page.buttons.select_tier');
  if (!isTierAvailable(selectedTierKey, get(tierSupply)))
    return t('sponsor.sponsor_page.buttons.sold_out', { tier: tier.label });
  if (get(isApproving))
    return t('sponsor.sponsor_page.buttons.approving');
  if (get(needsApproval))
    return t('sponsor.sponsor_page.buttons.approve', { currency });
  if (get(sponsorshipState).status === 'pending')
    return t('sponsor.sponsor_page.buttons.minting');
  return t('sponsor.sponsor_page.buttons.mint', { tier: tier.label });
});

const buttonAction = computed(() => {
  const selectedTierKey = get(selectedTier);
  const visible = get(visibleTiers);

  if (!get(connected))
    return open;
  if (!get(isExpectedChain))
    return () => switchNetwork();
  if (visible.length === 0)
    return () => {};
  if (!isTierAvailable(selectedTierKey, get(tierSupply)))
    return () => {};
  if (get(needsApproval))
    return () => {}; // No-op, the menu handles it
  return handleMint;
});

const isButtonDisabled = computed(() => {
  const selectedTierKey = get(selectedTier);
  const visible = get(visibleTiers);
  return visible.length === 0 || get(sponsorshipState).status === 'pending' || get(isApproving) || !isTierAvailable(selectedTierKey, get(tierSupply));
});

// Auto-select first visible tier if current selection is not visible
watchEffect(() => {
  const visible = get(visibleTiers);
  const current = get(selectedTier);

  if (visible.length > 0 && // If current tier is not in the visible list, select the first visible one
    !visible.some(tier => tier.key === current)) {
    set(selectedTier, visible[0].key);
  }
});

// Auto-select first available token if current selection is not available
watchEffect(() => {
  const available = get(availableTokens);
  const current = get(selectedCurrency);

  if (available.length > 0 &&
    !available.some(token => token.symbol === current)) {
    set(selectedCurrency, available[0].symbol);
  }
});

async function checkAllowanceIfNeeded() {
  if (!get(isExpectedChain)) {
    return;
  }

  const currency = get(selectedCurrency);
  const token = get(paymentTokens).find(t => t.symbol === currency);

  if (token && token.address !== ETH_ADDRESS && get(connected)) {
    try {
      const allowance = await checkTokenAllowance(currency);
      set(tokenAllowance, allowance);
    }
    catch (error) {
      logger.error('Failed to check token allowance:', error);
    }
  }
}

watch([selectedCurrency, connected, isExpectedChain], checkAllowanceIfNeeded);

// Function to call after successful minting
async function onMintingSuccess(txHash: string) {
  try {
    // Call the endpoint to monitor the transaction
    await fetchWithCsrf('/webapi/nfts/monitor-tx/', {
      method: 'POST',
      body: {
        txHash,
      },
    });

    logger.info(`Transaction monitoring started for: ${txHash}`);
  }
  catch (error) {
    logger.error('Failed to start transaction monitoring:', error);
  }
}

// Show success dialog when minting is successful
watch(() => get(sponsorshipState).status, async (newStatus) => {
  if (newStatus === 'success' && get(transactionUrl)) {
    set(showSuccessDialog, true);

    // Call the success callback function
    const state = get(sponsorshipState);
    if (state.txHash) {
      await onMintingSuccess(state.txHash);
    }

    // Refresh sponsorship data after successful minting
    await refreshSponsorshipData();
  }
});

onBeforeMount(async () => {
  // Fetch metadata to ensure config is available
  await fetchMetadata();

  // Only continue if metadata fetch was successful
  if (!get(metadataError)) {
    // Only load currencies and check allowance on client-side
    await loadPaymentTokens();
    await checkAllowanceIfNeeded();
  }
});
</script>

<template>
  <div
    v-if="metadataError || dataError"
    class="my-20 flex items-center justify-center"
  >
    <div class="flex flex-col gap-4 justify-center items-center text-center p-8">
      <img
        class="w-40"
        alt="sponsorship page unavailable"
        src="/img/maintenance.svg"
      />

      <div class="text-rui-text-secondary whitespace-break-spaces">
        <i18n-t keypath="sponsor.sponsor_page.error.unavailable">
          <template #email>
            <ButtonLink
              inline
              color="primary"
              :to="supportEmailMailto"
              class="underline"
              external
            >
              {{ supportEmail }}
            </ButtonLink>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>

  <!-- Normal content when metadata loads successfully -->
  <div
    v-else
    class="marketplace-container"
  >
    <div class="flex flex-col lg:flex-row gap-10 max-w-6xl mx-auto">
      <!-- NFT Image Section -->
      <div class="lg:w-1/2 flex justify-center">
        <MintNftImage
          :selected-tier="selectedTier"
          :nft-images="nftImages"
          :is-loading="isLoading"
          :error="!!error"
          @retry="$router.go(0)"
        />
      </div>

      <!-- Options and Description Section -->
      <div class="lg:w-1/2">
        <div class="space-y-6">
          <div>
            <h5 class="text-h4 font-bold mb-2">
              {{ t('sponsor.sponsor_page.title') }}
            </h5>
            <p class="text-rui-text-secondary mb-6">
              {{ t('sponsor.sponsor_page.description').replace('{leaderboard_link}', '') }}<ButtonLink
                to="/sponsor/leaderboard"
                color="primary"
                inline
                class="underline"
                variant="text"
              >
                {{ t('sponsor.sponsor_page.leaderboard_link_text') }}
              </ButtonLink>
            </p>
          </div>

          <!-- Currency Selection -->
          <MintCurrencySelection
            v-model="selectedCurrency"
            :available-tokens="availableTokens"
            :is-loading="isLoadingPaymentTokens"
          />

          <!-- Tier Selection -->
          <MintTierSelection
            v-if="availableTokens.length > 0"
            v-model="selectedTier"
            :tier-supply="tierSupply"
            :tier-price-display="tierPriceDisplay"
            :visible-tiers="visibleTiers"
          />

          <!-- Transaction Status -->
          <RuiAlert
            v-if="sponsorshipState.status === 'error'"
            type="error"
            class="mt-4"
            closeable
            @close="resetSponsorshipState()"
          >
            <template #title>
              {{ t('sponsor.sponsor_page.error.minting_failed') }}
            </template>
            {{ sponsorshipState.error }}
          </RuiAlert>

          <!-- Mint/Approval Button -->
          <MintButton
            :connected="connected"
            :address="address"
            :is-expected-chain="isExpectedChain"
            :needs-approval="needsApproval"
            :is-approving="isApproving"
            :is-button-disabled="isButtonDisabled"
            :button-text="buttonText"
            :button-action="buttonAction"
            :selected-currency="selectedCurrency"
            :selected-tier="selectedTier"
            :sponsorship-status="sponsorshipState.status"
            :get-price-for-tier="getPriceForTier"
            :open="open"
            @approve="handleApprove($event)"
          />

          <!-- Benefits Info -->
          <MintBenefitsInfo
            :selected-tier="selectedTier"
            :tier-content="tierContent"
            :release-name="releaseName"
          />
        </div>
      </div>
    </div>

    <!-- Success Dialog -->
    <MintSuccessDialog
      v-model="showSuccessDialog"
      :selected-tier="selectedTier"
      :token-id="sponsorshipState.tokenId"
      :release-name="releaseName"
      :transaction-url="transactionUrl"
    />
  </div>
</template>
