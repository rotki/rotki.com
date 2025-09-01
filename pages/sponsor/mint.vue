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
import { getTierClasses } from '~/utils/nft-tiers';
import { toTitleCase, truncateAddress } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

const description = 'Sponsor rotki\'s next release';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title: 'Sponsor | rotki',
  meta: [
    ...getMetadata('Sponsor | rotki', description, baseUrl, `${baseUrl}/sponsor/mint`),
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

const selectedTier = ref<string>('bronze');
const isApproving = ref<boolean>(false);
const tokenAllowance = ref<string>('0');
const approvalType = ref<ApprovalType>(APPROVAL_TYPE.UNLIMITED);
const showApprovalOptions = ref<boolean>(false);
const showSuccessDialog = ref(false);
const showExampleSponsors = ref<boolean>(false);
const imageLoading = ref<boolean>(true);

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
    set(showApprovalOptions, false);
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

// Reset approval options when tier or currency changes
watch([selectedTier, selectedCurrency], () => {
  set(showApprovalOptions, false);
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
        <div class="nft-image-container w-full flex justify-center lg:block">
          <div class="aspect-square w-full max-w-md md:max-w-full bg-rui-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
            <div
              v-if="error"
              class="text-rui-error text-center"
            >
              <div class="text-lg font-medium">
                {{ t('sponsor.sponsor_page.nft_image.failed_to_load') }}
              </div>
              <button
                class="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                @click="$router.go(0)"
              >
                {{ t('sponsor.sponsor_page.nft_image.retry') }}
              </button>
            </div>
            <div
              v-else-if="nftImages[selectedTier]"
              class="w-full h-full bg-rui-grey-50 relative"
            >
              <img
                :key="nftImages[selectedTier]"
                :src="nftImages[selectedTier]"
                :alt="t('sponsor.sponsor_page.nft_image.alt', { tier: findTierByKey(selectedTier)?.label })"
                class="w-full h-full object-cover rounded-lg z-[2]"
                @loadstart="imageLoading = true"
                @load="imageLoading = false"
                @error="imageLoading = false"
              />
              <RuiSkeletonLoader
                v-if="imageLoading"
                class="absolute top-0 left-0 z-[1] w-full h-full"
              />
            </div>
            <RuiSkeletonLoader
              v-else-if="isLoading"
              class="w-full h-full"
            />
            <div
              v-else
              class="text-rui-text-secondary text-center"
            >
              <div class="text-4xl mb-2">
                🎨
              </div>
              <div class="text-lg font-medium">
                {{ t('sponsor.sponsor_page.nft_image.not_available', { tier: findTierByKey(selectedTier)?.label }) }}
              </div>
              <div class="text-sm text-rui-text-secondary mt-1">
                {{ t('sponsor.sponsor_page.nft_image.image_not_available') }}
              </div>
            </div>
          </div>
        </div>
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
          <div class="space-y-4">
            <h6 class="font-bold">
              {{ t('sponsor.sponsor_page.payment_currency') }}
            </h6>
            <div
              v-if="isLoadingPaymentTokens"
              class="flex gap-2"
            >
              <RuiSkeletonLoader
                v-for="i in 2"
                :key="i"
                class="w-20 h-8"
              />
            </div>
            <div
              v-else-if="availableTokens.length > 0"
              class="flex flex-wrap gap-2 max-w-full"
            >
              <RuiButton
                v-for="token in availableTokens"
                :key="token.symbol"
                :variant="selectedCurrency === token.symbol ? 'default' : 'outlined'"
                color="primary"
                size="sm"
                @click="selectedCurrency = token.symbol"
              >
                <template #prepend>
                  <CryptoAssetIcon
                    class="bg-white rounded-full"
                    :icon-url="token.icon_url"
                    :name="token.symbol"
                  />
                </template>
                {{ token.symbol }}
              </RuiButton>
            </div>
            <div
              v-else
              class="text-rui-text-secondary"
            >
              {{ t('sponsor.sponsor_page.no_payment_tokens_available') }}
            </div>
          </div>

          <!-- Tier Selection -->
          <div
            v-if="availableTokens.length > 0"
            class="space-y-4"
          >
            <h6 class="font-bold">
              {{ t('sponsor.sponsor_page.select_tier') }}
            </h6>
            <div class="space-y-3">
              <RuiCard
                v-for="tier in visibleTiers"
                :key="tier.key"
                class="tier-option"
                content-class="flex items-center justify-between h-16 !py-2 transition-all cursor-pointer"
                :class="{
                  '!border-rui-primary': selectedTier === tier.key,
                  'opacity-60': tierSupply[tier.key] && !isTierAvailable(tier.key, tierSupply),
                }"
                @click="selectedTier = tier.key"
              >
                <RuiRadio
                  :id="tier.key"
                  v-model="selectedTier"
                  :value="tier.key"
                  name="tier"
                  :hide-details="true"
                  class="font-bold uppercase"
                  color="primary"
                  :label="tier.label"
                />
                <div class="flex flex-col items-end">
                  <div class="text-lg font-bold text-rui-primary">
                    {{ tierPriceDisplay[tier.key] }}
                  </div>
                  <div
                    v-if="tierSupply[tier.key]"
                    class="text-sm text-rui-text-secondary"
                  >
                    <template v-if="tierSupply[tier.key].maxSupply === 0">
                      {{ t('sponsor.sponsor_page.pricing.minted', { current: tierSupply[tier.key].currentSupply }) }}
                    </template>
                    <template v-else>
                      {{ t('sponsor.sponsor_page.pricing.minted_with_max', { current: tierSupply[tier.key].currentSupply, max: tierSupply[tier.key].maxSupply }) }}
                      <span
                        v-if="tierSupply[tier.key] && !isTierAvailable(tier.key, tierSupply)"
                        class="text-sm text-rui-error font-medium"
                      >
                        {{ t('sponsor.sponsor_page.pricing.sold_out') }}
                      </span>
                    </template>
                  </div>
                </div>
              </RuiCard>
            </div>
          </div>

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
          <div class="pt-4">
            <div class="flex gap-1 overflow-hidden">
              <!-- Approval Menu for when approval is needed -->
              <RuiMenu
                v-if="needsApproval && !isApproving"
                v-model="showApprovalOptions"
                :popper="{ placement: 'bottom' }"
                class="w-full"
                wrapper-class="w-full"
              >
                <template #activator="{ attrs }">
                  <RuiButton
                    color="primary"
                    size="lg"
                    class="w-full flex-1 [&_span]:!text-wrap"
                    :disabled="isButtonDisabled"
                    v-bind="attrs"
                  >
                    {{ t('sponsor.sponsor_page.buttons.approve', { currency: selectedCurrency }) }}
                    <template #append>
                      <RuiIcon
                        name="lu-chevron-down"
                        size="16"
                      />
                    </template>
                  </RuiButton>
                </template>
                <template #default="{ width }">
                  <div :style="{ width: `${width}px` }">
                    <RuiButton
                      variant="list"
                      @click="handleApprove(APPROVAL_TYPE.UNLIMITED)"
                    >
                      {{ t('sponsor.sponsor_page.approval.unlimited_button') }}
                    </RuiButton>
                    <RuiButton
                      variant="list"
                      @click="handleApprove(APPROVAL_TYPE.EXACT)"
                    >
                      {{ t('sponsor.sponsor_page.approval.exact_button', {
                        amount: getPriceForTier(selectedCurrency, selectedTier as TierKey),
                        currency: selectedCurrency,
                      }) }}
                    </RuiButton>
                  </div>
                </template>
              </RuiMenu>

              <!-- Loading state while approving -->
              <RuiButton
                v-if="isApproving"
                color="primary"
                size="lg"
                class="w-full flex-1 [&_span]:!text-wrap"
                :loading="true"
                disabled
              >
                {{ t('sponsor.sponsor_page.buttons.approving') }}
              </RuiButton>

              <!-- Regular mint button -->
              <RuiButton
                v-if="!needsApproval && !isApproving"
                color="primary"
                size="lg"
                class="w-full flex-1 [&_span]:!text-wrap"
                :loading="sponsorshipState.status === 'pending'"
                :disabled="isButtonDisabled"
                @click="buttonAction()"
              >
                <template #prepend>
                  <RuiIcon
                    v-if="connected"
                    name="lu-external-link"
                  />
                  <RuiIcon
                    v-else
                    name="lu-wallet"
                  />
                </template>
                {{ buttonText }}
              </RuiButton>
              <RuiButton
                v-if="connected"
                size="lg"
                color="secondary"
                class="!px-3"
                @click="open()"
              >
                <RuiIcon name="lu-wallet" />
              </RuiButton>
            </div>
            <div
              v-if="connected && address"
              class="text-sm text-rui-text-secondary mt-2"
            >
              {{ t('sponsor.sponsor_page.connected_to', { address: truncateAddress(address) }) }}
            </div>
          </div>

          <!-- Benefits Info -->
          <div class="bg-rui-grey-100 p-4 rounded-lg">
            <h6 class="font-bold mb-2">
              {{ t('sponsor.sponsor_page.benefits.title') }}
            </h6>
            <div
              v-if="tierContent[selectedTier]"
              class="text-sm text-rui-text-secondary"
            >
              <p>
                {{ t('sponsor.sponsor_page.benefits.tier_sponsorship', { tier: toTitleCase(selectedTier), releaseName }) }}
              </p>
              <p class="font-medium mt-1">
                {{ t('sponsor.sponsor_page.benefits.benefits_label', { benefits: tierContent[selectedTier].benefits }) }}
              </p>

              <!-- Example Sponsor Images -->
              <div
                v-if="tierContent[selectedTier].example && tierContent[selectedTier].example.length > 0"
                class="mt-4"
              >
                <RuiButton
                  variant="text"
                  size="sm"
                  color="primary"
                  class="!p-0 font-medium text-rui-text hover:text-rui-primary"
                  @click="showExampleSponsors = !showExampleSponsors"
                >
                  <template #append>
                    <RuiIcon
                      :name="showExampleSponsors ? 'lu-chevron-down' : 'lu-chevron-right'"
                      size="16"
                    />
                  </template>
                  {{ t('sponsor.sponsor_page.benefits.see_examples') }}
                </RuiButton>
                <div
                  v-if="showExampleSponsors"
                  class="flex flex-wrap gap-2 mt-2"
                >
                  <img
                    v-for="(imageUrl, index) in tierContent[selectedTier].example"
                    :key="index"
                    :src="imageUrl"
                    :alt="`Sponsor example ${index + 1}`"
                    class="w-full rounded-md object-cover"
                  />
                </div>
              </div>
            </div>
            <div
              v-else
              class="space-y-2"
            >
              <RuiSkeletonLoader />
              <RuiSkeletonLoader />
              <RuiSkeletonLoader />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Dialog -->
    <RuiDialog
      v-model="showSuccessDialog"
      max-width="400px"
    >
      <RuiCard content-class="!pt-0">
        <template #header>
          <div class="flex items-center gap-3">
            <RuiIcon
              name="lu-circle-check"
              class="text-rui-success"
              size="24"
            />
            <span class="text-h6 font-bold">{{ t('sponsor.sponsor_page.success_dialog.title', { id: sponsorshipState.tokenId }) }}</span>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-rui-text-secondary">
            {{ t('sponsor.sponsor_page.success_dialog.success_message', {
              tier: findTierByKey(selectedTier)?.label,
            }) }}
          </p>
          <p
            class="font-medium px-4 py-3 rounded-lg"
            :class="getTierClasses(selectedTier)"
          >
            {{ releaseName
              ? t('sponsor.sponsor_page.success_dialog.thank_you_with_release', { release: releaseName })
              : t('sponsor.sponsor_page.success_dialog.thank_you_upcoming')
            }}
          </p>

          <div class="flex flex-col gap-3 pt-2">
            <ButtonLink
              v-if="transactionUrl"
              :to="transactionUrl"
              variant="outlined"
              color="primary"
              class="w-full"
              external
            >
              <template #prepend>
                <RuiIcon name="lu-external-link" />
              </template>
              {{ t('sponsor.sponsor_page.success_dialog.view_etherscan') }}
            </ButtonLink>

            <ButtonLink
              :to="`/sponsor/submit-name${sponsorshipState.tokenId ? `?tokenId=${sponsorshipState.tokenId}` : ''}`"
              variant="default"
              color="primary"
              class="w-full"
            >
              <template #prepend>
                <RuiIcon name="lu-user-plus" />
              </template>
              {{ t('sponsor.sponsor_page.success_dialog.request_name') }}
            </ButtonLink>

            <ButtonLink
              to="/sponsor/leaderboard"
              variant="outlined"
              color="primary"
              class="w-full"
            >
              <template #prepend>
                <RuiIcon name="lu-trophy" />
              </template>
              {{ t('sponsor.sponsor_page.success_dialog.view_leaderboard') }}
            </ButtonLink>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end w-full">
            <RuiButton
              variant="text"
              color="primary"
              @click="showSuccessDialog = false"
            >
              {{ t('sponsor.sponsor_page.success_dialog.close') }}
            </RuiButton>
          </div>
        </template>
      </RuiCard>
    </RuiDialog>

    <Confetti
      v-if="showSuccessDialog"
      class="absolute top-0 left-0 w-full h-full z-[10000]"
    />
  </div>
</template>
