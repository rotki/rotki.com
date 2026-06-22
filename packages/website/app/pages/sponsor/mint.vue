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
import { useMintFlow } from '~/modules/web3/sponsorship/use-mint-flow';

usePageSeo('Sponsor rotki — Support Open-Source Privacy Software', 'Support rotki\'s development. Fund independent, local-first, privacy-preserving portfolio management software.', '/sponsor/mint', {
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
    <div class="flex flex-col lg:flex-row gap-10 max-w-6xl mx-auto">
      <!-- NFT Image Section -->
      <div class="lg:w-1/2 flex justify-center">
        <MintNftImage
          :selected-tier="modelSelectedTier"
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
            :connected="connected"
            :address="address"
            :needs-approval="needsApproval"
            :is-approving="isApproving"
            :is-button-disabled="isButtonDisabled"
            :button-text="buttonText"
            :button-action="buttonAction"
            :selected-currency="modelCurrency"
            :selected-tier="modelSelectedTier"
            :sponsorship-status="sponsorshipState.status"
            :get-price-for-tier="getPriceForTier"
            :open="open"
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
