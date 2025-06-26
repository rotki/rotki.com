<script setup lang="ts">
import { get } from '@vueuse/core';
import { SPONSORSHIP_TIERS } from '~/composables/rotki-sponsorship';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const description = 'Sponsor rotki next release';

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

const sponsorship = useRotkiSponsorship();

const {
  connected,
  isExpectedChain,
  sponsorshipState,
  tierPrices,
  tierSupply,
  tierBenefits,
  nftImages,
  isLoading,
  error,
  transactionUrl,
  open: openWallet,
  switchNetwork,
  fetchTierPrices,
  loadNFTImages,
  mintSponsorshipNFT,
  isTierAvailable,
} = sponsorship;

async function handleMint() {
  try {
    const tier = SPONSORSHIP_TIERS.find(t => t.key === get(selectedTier));
    if (!tier)
      return;

    await mintSponsorshipNFT(tier.tierId);
  }
  catch (error) {
    console.error('Minting failed:', error);
  }
}

const buttonText = computed(() => {
  const selectedTierKey = get(selectedTier);
  const tier = SPONSORSHIP_TIERS.find(t => t.key === selectedTierKey);

  if (!get(connected))
    return 'Connect Wallet';
  if (!get(isExpectedChain))
    return 'Switch Network';
  if (!isTierAvailable(selectedTierKey))
    return `${tier?.label} Sold Out`;
  if (get(sponsorshipState).status === 'pending')
    return 'Minting...';
  return `Mint ${tier?.label} NFT`;
});

const buttonAction = computed(() => {
  const selectedTierKey = get(selectedTier);

  if (!get(connected))
    return openWallet;
  if (!get(isExpectedChain))
    return () => switchNetwork();
  if (!isTierAvailable(selectedTierKey))
    return () => {};
  return handleMint;
});

const isButtonDisabled = computed(() => {
  const selectedTierKey = get(selectedTier);
  return get(sponsorshipState).status === 'pending' || !isTierAvailable(selectedTierKey);
});

onMounted(() => {
  fetchTierPrices();
  loadNFTImages();
});
</script>

<template>
  <div class="marketplace-container">
    <div class="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      <!-- NFT Image Section -->
      <div class="lg:w-1/2 flex justify-center">
        <div class="nft-image-container w-full flex justify-center lg:block">
          <div class="aspect-square w-full max-w-md bg-rui-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
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
            <h5 class="text-h5 font-bold mb-2">
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
                content-class="flex items-center justify-between !py-2 transition-all cursor-pointer"
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
                    {{ tierPrices[tier.key] ? `${tierPrices[tier.key]} ETH` : 'Loading...' }}
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
          </div>

          <!-- Benefits Info -->
          <div class="bg-rui-grey-50 p-4 rounded-lg">
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
            <ul
              v-else
              class="text-sm text-rui-text-secondary space-y-1"
            >
              <li>• Exclusive NFT artwork</li>
              <li>• Supporting rotki development</li>
              <li>• Special community recognition</li>
              <li>• Dedicated discord channel</li>
            </ul>
          </div>

          <!-- Transaction Status -->
          <RuiAlert
            v-if="sponsorshipState.status === 'success' && transactionUrl"
            type="success"
            class="mt-4"
          >
            <template #title>
              NFT Minted Successfully!
            </template>
            <ButtonLink
              :to="transactionUrl"
              variant="text"
              color="primary"
              class="underline"
              inline
              external
            >
              View transaction on Etherscan
            </ButtonLink>
          </RuiAlert>

          <RuiAlert
            v-else-if="sponsorshipState.status === 'error'"
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
  </div>
</template>
