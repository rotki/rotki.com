<script setup lang="ts">
import type { TierSupply } from '~/composables/rotki-sponsorship/types';
import { isTierAvailable } from '~/composables/rotki-sponsorship/utils';

interface Props {
  tierSupply: Record<string, TierSupply>;
  tierPriceDisplay: Record<string, string>;
  visibleTiers: Array<{ key: string; label: string; tierId: number }>;
}

const selectedTier = defineModel<string>({ required: true });

defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="space-y-4">
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
</template>
