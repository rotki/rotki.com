<script setup lang="ts">
import { set } from '@vueuse/core';
import { ethers } from 'ethers';
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

const RPC_URL = 'https://sepolia.gateway.tenderly.co';

const CONTRACT_ADDRESS = '0x281986c18a5680C149b95Fc15aa266b633B60e96';

const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, bytes32 currencySymbol) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function ETH() external view returns (bytes32)',
];

const provider = new ethers.JsonRpcProvider(RPC_URL);

const tiers = [
  { key: 'bronze', label: 'Bronze', tierId: 0, price: '0' },
  { key: 'silver', label: 'Silver', tierId: 1, price: '0' },
  { key: 'gold', label: 'Gold', tierId: 2, price: '0' },
];

const selectedTier = ref('bronze');
const nftImages = ref<Record<string, string>>({});
const isLoading = ref(true);
const error = ref<string | null>(null);
const tierPrices = ref<Record<string, string>>({});

async function fetchTierPrices() {
  try {
    const prices: Record<string, string> = {};
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);
    const ethSymbol = await contract.ETH();

    for (const tier of tiers) {
      const price = await contract.getPrice(tier.tierId, ethSymbol);
      prices[tier.key] = ethers.formatEther(price);
    }

    set(tierPrices, prices);
    console.warn('Tier prices loaded:', prices);
  }
  catch (error_) {
    console.error('Error fetching tier prices:', error_);
  }
}

async function fetchNFTMetadata(tokenId: number, tierKey: string) {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

    const tokenURI = await contract.tokenURI(tokenId);
    console.warn(`Token URI for ${tierKey} token ${tokenId}:`, tokenURI);

    if (!tokenURI) {
      return null;
    }

    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.slice(7)}`;
    }

    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Metadata fetch error: ${response.status}`);
    }

    const metadata = await response.json();
    console.warn(`NFT metadata for ${tierKey} token ${tokenId}:`, metadata);

    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.slice(7)}`;
    }

    console.warn(`Extracted image URL for ${tierKey} token ${tokenId}:`, imageUrl);
    return imageUrl;
  }
  catch (error_) {
    console.error(`Error fetching NFT metadata for ${tierKey} token ${tokenId}:`, error_);
    return null;
  }
}

async function loadNFTImages() {
  set(isLoading, true);
  set(error, null);

  try {
    const images: Record<string, string> = {};

    for (const tier of tiers) {
      const imageUrl = await fetchNFTMetadata(0, tier.key);
      if (imageUrl) {
        images[tier.key] = imageUrl;
      }
    }

    console.warn('Final images object:', images);
    set(nftImages, images);
  }
  catch (error_) {
    set(error, 'Failed to load NFT images');
    console.error('Error loading NFT images:', error_);
  }
  finally {
    set(isLoading, false);
  }
}

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
        <div class="nft-image-container w-full">
          <div class="aspect-square w-full max-w-md bg-rui-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
            <RuiSkeletonLoader
              v-if="isLoading"
              class="w-full h-full"
            />
            <div
              v-else-if="error"
              class="text-red-500 text-center"
            >
              <div class="text-4xl mb-2">
                ❌
              </div>
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
                :alt="`${tiers.find(tier => tier.key === selectedTier)?.label} NFT`"
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
                {{ tiers.find(tier => tier.key === selectedTier)?.label }} NFT
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
              <div
                v-for="tier in tiers"
                :key="tier.key"
                class="tier-option"
                :class="{ selected: selectedTier === tier.key }"
                @click="selectedTier = tier.key"
              >
                <div class="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <RuiRadio
                    :id="tier.key"
                    v-model="selectedTier"
                    :value="tier.key"
                    name="tier"
                    hide-details
                    class="font-bold"
                    color="primary"
                    :label="tier.label"
                  />
                  <div class="text-lg font-bold text-primary-600">
                    {{ tierPrices[tier.key] ? `${tierPrices[tier.key]} ETH` : 'Loading...' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mint Button -->
          <div class="pt-4">
            <RuiButton
              color="primary"
              size="lg"
              class="w-full"
              disabled
            >
              <template #prepend>
                <RuiIcon name="lu-external-link" />
              </template>
              Mint {{ tiers.find(tier => tier.key === selectedTier)?.label }} NFT
            </RuiButton>
          </div>

          <!-- Additional Info -->
          <div class="bg-rui-grey-50 p-4 rounded-lg">
            <h6 class="font-bold mb-2">
              What you get:
            </h6>
            <ul class="text-sm text-rui-text-secondary space-y-1">
              <li>• Exclusive NFT artwork</li>
              <li>• Supporting rotki development</li>
              <li>• Special community recognition</li>
              <li>• Dedicated discord channel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
