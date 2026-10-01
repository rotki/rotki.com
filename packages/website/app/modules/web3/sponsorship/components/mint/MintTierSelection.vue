<script setup lang="ts">
import { SPONSORSHIP_TIERS, type TierSupply } from '~/modules/web3/sponsorship/types';
import { isTierAvailable } from '~/modules/web3/sponsorship/utils';

interface Props {
  disabled?: boolean;
  isLoading?: boolean;
  tierSupply: Record<string, TierSupply>;
  tierPriceDisplay: Record<string, string>;
  /** Marketing perks per tier, so tiers can be compared without selecting each one. */
  tierContent: Record<string, { benefits: string }>;
  visibleTiers: Array<{ key: string; label: string; tierId: number }>;
}

const selectedTier = defineModel<string>({ required: true });

const { disabled = false, isLoading = false } = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    class="space-y-3"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <h2 class="text-subtitle-1 font-medium text-rui-text">
      {{ t('sponsor.sponsor_page.select_tier') }}
    </h2>
    <div class="space-y-3">
      <RuiCard
        v-for="tier in (isLoading ? SPONSORSHIP_TIERS : visibleTiers)"
        :key="tier.key"
        class="tier-option"
        content-class="flex items-center justify-between gap-4 min-h-16 !py-3 transition-all"
        :class="{
          'cursor-pointer': !isLoading,
          '!border-rui-primary !bg-rui-primary/[0.04]': !isLoading && selectedTier === tier.key,
          'opacity-60': !isLoading && tierSupply[tier.key] && !isTierAvailable(tier.key, tierSupply),
        }"
        @click="!isLoading && (selectedTier = tier.key)"
      >
        <template v-if="isLoading">
          <div class="flex items-center gap-3">
            <RuiSkeletonLoader
              class="w-5 h-5"
              rounded="full"
            />
            <RuiSkeletonLoader class="w-20 h-5" />
          </div>
          <RuiSkeletonLoader class="w-24 h-5" />
        </template>
        <template v-else>
          <div class="flex flex-col min-w-0">
            <RuiRadio
              :id="tier.key"
              v-model="selectedTier"
              :value="tier.key"
              name="tier"
              hide-details
              class="font-bold uppercase"
              color="primary"
              :label="tier.label"
            />
            <!-- Offsets measured from RuiRadio: its label text starts 33px in, and the radio keeps a bottom margin we pull back -->
            <p
              v-if="tierContent[tier.key]"
              class="pl-[33px] -mt-1.5 text-body-2 text-rui-text-secondary"
            >
              {{ tierContent[tier.key]?.benefits }}
            </p>
          </div>
          <div class="flex flex-col items-end shrink-0">
            <div class="text-lg font-bold text-rui-primary">
              {{ tierPriceDisplay[tier.key] }}
            </div>
            <div
              v-if="tierSupply[tier.key]"
              class="text-sm text-rui-text-secondary"
            >
              <template v-if="tierSupply[tier.key]?.maxSupply === 0">
                {{ t('sponsor.sponsor_page.pricing.minted', { current: tierSupply[tier.key]?.currentSupply }) }}
              </template>
              <template v-else>
                {{ t('sponsor.sponsor_page.pricing.minted_with_max', { current: tierSupply[tier.key]?.currentSupply, max: tierSupply[tier.key]?.maxSupply }) }}
                <span
                  v-if="tierSupply[tier.key] && !isTierAvailable(tier.key, tierSupply)"
                  class="ml-1 text-sm text-rui-error font-medium"
                >
                  {{ t('sponsor.sponsor_page.pricing.sold_out') }}
                </span>
              </template>
            </div>
          </div>
        </template>
      </RuiCard>
    </div>
  </div>
</template>
