<script lang="ts" setup>
import { ref } from 'vue';

definePageMeta({
  layout: 'sponsor',
});

const activeTab = ref('gold');

type LeaderboardTier = 'gold' | 'silver' | 'bronze';

const leaderboardData: Record<LeaderboardTier, Array<{ rank: number; address: string; nftCount: number }>> = {
  gold: [
    { rank: 1, address: '0x742d35Cc6635Bb6C4e0C4DE4aE4E4dF9A3c45A9B', nftCount: 127 },
    { rank: 2, address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', nftCount: 98 },
    { rank: 3, address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', nftCount: 85 },
    { rank: 4, address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', nftCount: 73 },
    { rank: 5, address: '0x8ba1f109551bD432803012645Hac136c18ceC6FE', nftCount: 61 },
  ],
  silver: [
    { rank: 1, address: '0x1234567890123456789012345678901234567890', nftCount: 45 },
    { rank: 2, address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', nftCount: 38 },
    { rank: 3, address: '0x9876543210987654321098765432109876543210', nftCount: 32 },
    { rank: 4, address: '0x5555666677778888999900001111222233334444', nftCount: 27 },
    { rank: 5, address: '0xAABBCCDDEEFF00112233445566778899AABBCCDD', nftCount: 23 },
  ],
  bronze: [
    { rank: 1, address: '0x1111222233334444555566667777888899990000', nftCount: 18 },
    { rank: 2, address: '0xFFEEDDCCBBAA99887766554433221100FFEEDDCC', nftCount: 15 },
    { rank: 3, address: '0x0000111122223333444455556666777788889999', nftCount: 12 },
    { rank: 4, address: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d', nftCount: 9 },
    { rank: 5, address: '0x9f8e7d6c5b4a39281f0e9d8c7b6a59483f2e1d0c', nftCount: 6 },
  ],
};

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 rounded-lg">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-white mb-4">
          Sponsor Leaderboard
        </h1>
        <p class="text-xl text-gray-300">
          Our top supporters making a difference
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex justify-center mb-8">
        <div class="bg-white/10 backdrop-blur-md rounded-lg p-1 flex space-x-1">
          <button
            class="px-6 py-3 rounded-md font-semibold transition-all duration-200"
            :class="[
              activeTab === 'gold'
                ? 'bg-yellow-500 text-black shadow-lg'
                : 'text-white hover:bg-white/10',
            ]"
            @click="activeTab = 'gold'"
          >
            🥇 Gold Tier
          </button>
          <button
            class="px-6 py-3 rounded-md font-semibold transition-all duration-200"
            :class="[
              activeTab === 'silver'
                ? 'bg-gray-300 text-black shadow-lg'
                : 'text-white hover:bg-white/10',
            ]"
            @click="activeTab = 'silver'"
          >
            🥈 Silver Tier
          </button>
          <button
            class="px-6 py-3 rounded-md font-semibold transition-all duration-200"
            :class="[
              activeTab === 'bronze'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-white hover:bg-white/10',
            ]"
            @click="activeTab = 'bronze'"
          >
            🥉 Bronze Tier
          </button>
        </div>
      </div>

      <!-- Leaderboard Content -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div class="space-y-4">
            <div
              v-for="(user, index) in leaderboardData[activeTab as LeaderboardTier]"
              :key="user.rank"
              class="flex items-center p-4 rounded-xl transition-all duration-200 hover:transform hover:scale-[1.02]"
              :class="[
                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30'
                : 'bg-white/5 border border-white/10',
              ]"
            >
              <div class="flex items-center space-x-4 flex-1">
                <div class="flex-1">
                  <h3 class="text-white font-bold text-lg font-mono">
                    {{ shortenAddress(user.address) }}
                  </h3>
                  <p class="text-gray-400 text-sm font-mono">
                    {{ user.address }}
                  </p>
                  <p class="text-gray-300">
                    NFTs Owned: {{ user.nftCount }}
                  </p>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl font-bold"
                    :class="[
                      index === 0 ? 'text-yellow-400'
                      : index === 1 ? 'text-gray-300'
                        : index === 2 ? 'text-amber-500'
                          : 'text-white',
                    ]"
                  >
                    #{{ user.rank }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center mt-12">
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md mx-auto">
          <h3 class="text-2xl font-bold text-white mb-4">
            Join Our Sponsors
          </h3>
          <p class="text-gray-300 mb-6">
            Support our project and see your name on this leaderboard!
          </p>
          <ButtonLink
            variant="default"
            to="/sponsor/sponsor"
            size="lg"
            class="mx-auto"
          >
            Become a Sponsor
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
