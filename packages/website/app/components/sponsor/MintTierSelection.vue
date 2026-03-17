<script setup lang="ts">
import { SPONSORSHIP_TIERS, type TierSupply } from '~/composables/rotki-sponsorship/types';
import { isTierAvailable } from '~/composables/rotki-sponsorship/utils';

interface Props {
  disabled?: boolean;
  isLoading?: boolean;
  tierSupply: Record<string, TierSupply>;
  tierPriceDisplay: Record<string, string>;
  visibleTiers: Array<{ key: string; label: string; tierId: number }>;
}

const selectedTier = defineModel<string>({ required: true });

const { disabled = false, isLoading = false } = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    class="space-y-4"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <h6 class="font-bold">
      {{ t('sponsor.sponsor_page.select_tier') }}
    </h6>
    <div class="space-y-3">
      <RuiCard
        v-for="tier in (isLoading ? SPONSORSHIP_TIERS : visibleTiers)"
        :key="tier.key"
        class="tier-option"
        content-class="flex items-center justify-between h-16 !py-2 transition-all"
        :class="{
          'cursor-pointer': !isLoading,
          '!border-rui-primary': !isLoading && selectedTier === tier.key,
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
              <template v-if="tierSupply[tier.key]?.maxSupply === 0">
                {{ t('sponsor.sponsor_page.pricing.minted', { current: tierSupply[tier.key]?.currentSupply }) }}
              </template>
              <template v-else>
                {{ t('sponsor.sponsor_page.pricing.minted_with_max', { current: tierSupply[tier.key]?.currentSupply, max: tierSupply[tier.key]?.maxSupply }) }}
                <span
                  v-if="tierSupply[tier.key] && !isTierAvailable(tier.key, tierSupply)"
                  class="text-sm text-rui-error font-medium"
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
