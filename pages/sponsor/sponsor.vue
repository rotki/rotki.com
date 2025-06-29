<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { CURRENCY_OPTIONS, SPONSORSHIP_TIERS } from '~/composables/rotki-sponsorship';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const description = 'Sponsor rotki\'s next release';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title: 'Sponsor | rotki',
  meta: [
    ...getMetadata('Sponsor | rotki', description, baseUrl, `${baseUrl}/sponsor`),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'sponsor',
});

const selectedTier = ref('bronze');
const isApproving = ref(false);
const usdcAllowance = ref('0');
const showSuccessDialog = ref(false);

const sponsorship = useRotkiSponsorship();

const {
  connected,
  isExpectedChain,
  sponsorshipState,
  tierPrices,
  tierSupply,
  tierBenefits,
  nftImages,
  releaseName,
  isLoading,
  error,
  transactionUrl,
  selectedCurrency,
  open: openWallet,
  switchNetwork,
  fetchTierPrices,
  loadNFTImages,
  mintSponsorshipNFT,
  isTierAvailable,
  approveUSDC,
  checkUSDCAllowance,
} = sponsorship;

async function handleApprove() {
  try {
    set(isApproving, true);
    const tier = SPONSORSHIP_TIERS.find(t => t.key === get(selectedTier));
    if (!tier)
      return;

    const prices = get(tierPrices);
    const price = prices[tier.key]?.USDC;
    if (!price)
      return;

    const tx = await approveUSDC(price);
    await tx.wait();

    // Refresh allowance after approval
    const newAllowance = await checkUSDCAllowance();
    set(usdcAllowance, newAllowance);
  }
  catch (error) {
    console.error('Approval failed:', error);
  }
  finally {
    set(isApproving, false);
  }
}

async function handleMint() {
  try {
    const tier = SPONSORSHIP_TIERS.find(t => t.key === get(selectedTier));
    if (!tier)
      return;

    await mintSponsorshipNFT(tier.tierId, get(selectedCurrency));
  }
  catch (error) {
    console.error('Minting failed:', error);
  }
}

const needsApproval = computed(() => {
  const currency = get(selectedCurrency);
  if (currency !== 'USDC')
    return false;

  const selectedTierKey = get(selectedTier);
  const prices = get(tierPrices);
  const price = prices[selectedTierKey]?.USDC;
  const allowance = get(usdcAllowance);

  return price && parseFloat(allowance) < parseFloat(price);
});

const buttonText = computed(() => {
  const selectedTierKey = get(selectedTier);
  const tier = SPONSORSHIP_TIERS.find(t => t.key === selectedTierKey);
  const currency = get(selectedCurrency);

  if (!get(connected))
    return 'Connect Wallet';
  if (!get(isExpectedChain))
    return 'Switch Network';
  if (!isTierAvailable(selectedTierKey))
    return `${tier?.label} Sold Out`;
  if (get(isApproving))
    return 'Approving USDC...';
  if (get(needsApproval))
    return `Approve ${currency}`;
  if (get(sponsorshipState).status === 'pending')
    return 'Minting...';
  return `Mint ${tier?.label} sponsorship NFT`;
});

const buttonAction = computed(() => {
  const selectedTierKey = get(selectedTier);

  if (!get(connected))
    return openWallet;
  if (!get(isExpectedChain))
    return () => switchNetwork();
  if (!isTierAvailable(selectedTierKey))
    return () => {};
  if (get(needsApproval))
    return handleApprove;
  return handleMint;
});

const isButtonDisabled = computed(() => {
  const selectedTierKey = get(selectedTier);
  return get(sponsorshipState).status === 'pending' || get(isApproving) || !isTierAvailable(selectedTierKey);
});

async function checkAllowanceIfNeeded() {
  const currency = get(selectedCurrency);
  if (currency === 'USDC' && get(connected)) {
    try {
      const allowance = await checkUSDCAllowance();
      set(usdcAllowance, allowance);
    }
    catch (error) {
      console.error('Failed to check USDC allowance:', error);
    }
  }
}

watch(selectedCurrency, checkAllowanceIfNeeded);
watch(connected, checkAllowanceIfNeeded);

// Show success dialog when minting is successful
watch(() => sponsorshipState.value.status, (newStatus) => {
  if (newStatus === 'success' && get(transactionUrl)) {
    set(showSuccessDialog, true);
  }
});

onMounted(() => {
  fetchTierPrices();
  loadNFTImages();
  checkAllowanceIfNeeded();
});
</script>

<template>
  <div class="marketplace-container">
    <div class="flex flex-col lg:flex-row gap-10 max-w-6xl mx-auto">
      <!-- NFT Image Section -->
      <div class="lg:w-1/2 flex justify-center">
        <div class="nft-image-container w-full flex justify-center lg:block">
          <div class="aspect-square w-full max-w-md md:max-w-full bg-rui-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
            <RuiSkeletonLoader
              v-if="isLoading"
              class="w-full h-full"
            />
            <div
              v-else-if="error"
              class="text-red-500 text-center"
            >
              <div class="text-lg font-medium">
                Failed to load
              </div>
              <button
                class="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                @click="loadNFTImages()"
              >
                Retry
              </button>
            </div>
            <div
              v-else-if="nftImages[selectedTier]"
              class="w-full h-full bg-rui-grey-50"
            >
              <img
                :src="nftImages[selectedTier]"
                :alt="`${SPONSORSHIP_TIERS.find(tier => tier.key === selectedTier)?.label} NFT`"
                class="w-full h-full object-cover rounded-lg"
                @error="console.warn('Image failed to load')"
              />
            </div>
            <div
              v-else
              class="text-rui-text-secondary text-center"
            >
              <div class="text-4xl mb-2">
                🎨
              </div>
              <div class="text-lg font-medium">
                {{ SPONSORSHIP_TIERS.find(tier => tier.key === selectedTier)?.label }} NFT
              </div>
              <div class="text-sm text-rui-text-secondary mt-1">
                Image not available
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
              Sponsor next rotki release
            </h5>
            <p class="text-rui-text-secondary mb-6">
              Support rotki development by minting exclusive NFTs. Each tier unlocks special benefits and shows your commitment to the project. The more NFTs you hold, the higher you'll appear on the <ButtonLink
                to="/sponsor/leaderboard"
                color="primary"
                inline
                class="underline"
                variant="text"
              >
                leaderboard
              </ButtonLink>
            </p>
          </div>

          <!-- Currency Selection -->
          <div class="space-y-4">
            <h6 class="font-bold">
              Payment Currency
            </h6>
            <div class="flex gap-2">
              <RuiButton
                v-for="currency in CURRENCY_OPTIONS"
                :key="currency.key"
                :variant="selectedCurrency === currency.key ? 'default' : 'outlined'"
                color="primary"
                size="sm"
                @click="selectedCurrency = currency.key"
              >
                <template #prepend>
                  <CryptoAssetIcon
                    class="bg-white rounded-full"
                    :icon-url="currency.iconUrl"
                    :name="currency.symbol"
                  />
                </template>
                {{ currency.label }}
              </RuiButton>
            </div>
          </div>

          <!-- Tier Selection -->
          <div class="space-y-4">
            <h6 class="font-bold">
              Select Tier
            </h6>
            <div class="space-y-3">
              <RuiCard
                v-for="tier in SPONSORSHIP_TIERS"
                :key="tier.key"
                class="tier-option"
                content-class="flex items-center justify-between h-16 !py-2 transition-all cursor-pointer"
                :class="{
                  '!border-rui-primary': selectedTier === tier.key,
                  'opacity-60': tierSupply[tier.key] && !isTierAvailable(tier.key),
                }"
                @click="selectedTier = tier.key"
              >
                <RuiRadio
                  :id="tier.key"
                  v-model="selectedTier"
                  :value="tier.key"
                  name="tier"
                  :hide-details="true"
                  class="font-bold"
                  color="primary"
                  :label="tier.label"
                />
                <div class="flex flex-col items-end">
                  <div class="text-lg font-bold text-rui-primary">
                    {{ tierPrices[tier.key]?.[selectedCurrency] ? `${tierPrices[tier.key][selectedCurrency]} ${selectedCurrency}` : 'Loading...' }}
                  </div>
                  <div
                    v-if="tierSupply[tier.key]"
                    class="text-sm text-rui-text-secondary"
                  >
                    <template v-if="tierSupply[tier.key].maxSupply === 0">
                      {{ tierSupply[tier.key].currentSupply }} minted
                    </template>
                    <template v-else>
                      {{ tierSupply[tier.key].currentSupply }}/{{ tierSupply[tier.key].maxSupply }} minted
                    </template>
                  </div>
                  <div
                    v-if="tierSupply[tier.key] && !isTierAvailable(tier.key)"
                    class="text-sm text-red-500 font-medium"
                  >
                    Sold Out
                  </div>
                </div>
              </RuiCard>
            </div>
          </div>

          <!-- Mint Button -->
          <div class="pt-4">
            <RuiButton
              color="primary"
              size="lg"
              class="w-full"
              :loading="sponsorshipState.status === 'pending' || isApproving"
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
          </div>

          <!-- Benefits Info -->
          <div class="bg-rui-grey-100 p-4 rounded-lg">
            <h6 class="font-bold mb-2">
              What you get:
            </h6>
            <div
              v-if="tierBenefits[selectedTier]"
              class="text-sm text-rui-text-secondary"
            >
              <p class="mb-2">
                {{ tierBenefits[selectedTier].description }}
              </p>
              <p class="font-medium">
                Benefits: {{ tierBenefits[selectedTier].benefits }}
              </p>
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

          <!-- Transaction Status -->

          <RuiAlert
            v-if="sponsorshipState.status === 'error'"
            type="error"
            class="mt-4"
          >
            <template #title>
              Minting Failed
            </template>
            {{ sponsorshipState.error }}
          </RuiAlert>
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
            <span class="text-h6 font-bold">NFT Minted Successfully!</span>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-rui-text-secondary">
            Your <span
              class="font-bold"
              :class="{
                'text-amber-600': selectedTier === 'bronze',
                'text-gray-500': selectedTier === 'silver',
                'text-yellow-500': selectedTier === 'gold',
              }"
            >
              {{ SPONSORSHIP_TIERS.find(tier => tier.key === selectedTier)?.label }}
            </span> sponsorship NFT has been minted successfully!
          </p>
          <p
            class="font-medium px-4 py-3 rounded-lg"
            :class="{
              'bg-amber-100 text-amber-800': selectedTier === 'bronze',
              'bg-gray-100 text-gray-800': selectedTier === 'silver',
              'bg-yellow-100 text-yellow-800': selectedTier === 'gold',
            }"
          >
            Thank you for sponsoring the {{ releaseName ? `"${releaseName}"` : 'upcoming' }} rotki release! 🚀
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
              View on Etherscan
            </ButtonLink>

            <ButtonLink
              to="/sponsor/leaderboard"
              variant="default"
              color="primary"
              class="w-full"
            >
              <template #prepend>
                <RuiIcon name="lu-trophy" />
              </template>
              View Leaderboard
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
              Close
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
