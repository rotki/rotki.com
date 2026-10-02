<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeo } from '~/composables/use-page-seo';
import WalletPickerDialog from '~/modules/web3/components/WalletPickerDialog.vue';
import MintBenefitsInfo from '~/modules/web3/sponsorship/components/mint/MintBenefitsInfo.vue';
import MintButton from '~/modules/web3/sponsorship/components/mint/MintButton.vue';
import MintCurrencySelection from '~/modules/web3/sponsorship/components/mint/MintCurrencySelection.vue';
import MintNftImage from '~/modules/web3/sponsorship/components/mint/MintNftImage.vue';
import MintSuccessDialog from '~/modules/web3/sponsorship/components/mint/MintSuccessDialog.vue';
import MintTierSelection from '~/modules/web3/sponsorship/components/mint/MintTierSelection.vue';
import SponsorHowItWorks from '~/modules/web3/sponsorship/components/mint/SponsorHowItWorks.vue';
import { useMintFlow } from '~/modules/web3/sponsorship/use-mint-flow';

usePageSeo('Sponsor rotki: fund privacy-first open source', 'Mint a sponsorship NFT for the next rotki release. Fund independent, local-first portfolio software and get your name in the release.', '/sponsor/mint', {
  ogImage: 'mint.png',
  keywords: 'open source sponsorship, open source funding, privacy software, local-first software, crypto sponsorship, NFT sponsorship, rotki sponsor',
});

definePageMeta({
  layout: 'sponsor',
});

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();

const { t } = useI18n({ useScope: 'global' });

const {
  address,
  availableTokens,
  buttonAction,
  buttonText,
  configReady,
  connected,
  dataError,
  error,
  fundsStatus,
  getPriceForTier,
  handleApprove,
  isApproving,
  isButtonDisabled,
  isLoading,
  isLoadingBalance,
  isLoadingPaymentTokens,
  isMintingEnabled,
  metadataError,
  modelCurrency,
  needsApproval,
  nftImages,
  selectedTokenBalance,
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
} = useMintFlow();
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
        width="160"
        height="120"
        loading="lazy"
      />

      <div class="text-rui-text-secondary whitespace-break-spaces">
        <i18n-t
          keypath="sponsor.sponsor_page.error.unavailable"
          scope="global"
        >
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
    <!-- Grid instead of two flex columns so phones read the heading before the artwork -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 max-w-6xl mx-auto">
      <div class="flex flex-col gap-3 lg:col-start-2 lg:row-start-1">
        <p class="text-rui-primary text-subtitle-1 font-medium">
          {{ releaseName ? t('sponsor.sponsor_page.eyebrow', { release: releaseName }) : t('sponsor.sponsor_page.eyebrow_upcoming') }}
        </p>
        <h1 class="text-h4 !font-bold text-balance">
          {{ t('sponsor.sponsor_page.title') }}
        </h1>
        <i18n-t
          keypath="sponsor.sponsor_page.description"
          scope="global"
          tag="p"
          class="text-body-1 text-rui-text-secondary"
        >
          <template #leaderboard_link>
            <NuxtLink
              to="/sponsor/leaderboard"
              class="text-rui-primary underline hover:no-underline"
            >
              {{ t('sponsor.sponsor_page.leaderboard_link_text') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>

      <!-- NFT Image Section: stays in view while the options column scrolls -->
      <div class="flex justify-center lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-8 lg:self-start">
        <MintNftImage
          :selected-tier="modelSelectedTier"
          :nft-images="nftImages"
          :is-loading="isLoading"
          :error="!!error"
          @retry="$router.go(0)"
        />
      </div>

      <!-- Options Section -->
      <div class="lg:col-start-2 lg:row-start-2">
        <div class="space-y-6">
          <!-- Minting Unavailable Warning -->
          <RuiAlert
            v-if="configReady && !isMintingEnabled"
            type="warning"
          >
            {{ t('sponsor.sponsor_page.minting_unavailable') }}
          </RuiAlert>

          <!-- Currency Selection -->
          <MintCurrencySelection
            v-model="modelCurrency"
            :available-tokens="availableTokens"
            :balance="selectedTokenBalance"
            :balance-loading="connected && isLoadingBalance"
            :disabled="!isMintingEnabled"
            :is-loading="isLoadingPaymentTokens"
          />

          <!-- Tier Selection -->
          <MintTierSelection
            v-model="modelSelectedTier"
            :disabled="!isMintingEnabled"
            :is-loading="isLoadingPaymentTokens"
            :tier-supply="tierSupply"
            :tier-price-display="tierPriceDisplay"
            :tier-content="tierContent"
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

          <!-- Soft warning: enough to pay, but maybe not enough to cover gas -->
          <RuiAlert
            v-if="connected && fundsStatus.gasShortfall"
            type="warning"
          >
            {{ t('sponsor.sponsor_page.insufficient_gas') }}
          </RuiAlert>

          <!-- Mint/Approval Button -->
          <MintButton
            :wallet="{ connected, address, open }"
            :approval="{ needsApproval, isApproving }"
            :action="{ disabled: isButtonDisabled, text: buttonText, run: buttonAction }"
            :selected-currency="modelCurrency"
            :selected-tier="modelSelectedTier"
            :sponsorship-status="sponsorshipState.status"
            :get-price-for-tier="getPriceForTier"
            @approve="handleApprove($event)"
          />

          <!-- Benefits Info -->
          <MintBenefitsInfo
            :selected-tier="modelSelectedTier"
            :tier-content="tierContent"
            :release-name="releaseName"
          />
        </div>
      </div>
    </div>

    <SponsorHowItWorks class="max-w-6xl mx-auto mt-16 lg:mt-24" />

    <!-- Success Dialog -->
    <MintSuccessDialog
      v-model="modelShowSuccessDialog"
      :selected-tier="modelSelectedTier"
      :token-id="sponsorshipState.tokenId"
      :release-name="releaseName"
      :transaction-url="transactionUrl"
    />

    <WalletPickerDialog />
  </div>
</template>
