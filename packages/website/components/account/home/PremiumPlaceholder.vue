<script setup lang="ts">
import type { PremiumTierInfo, PremiumTierInfoDescription } from '~/types/tiers';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useTiersStore } from '~/store/tiers';

const { t } = useI18n({ useScope: 'global' });

const tiersStore = useTiersStore();
const { tiersInformation } = storeToRefs(tiersStore);

const basicTier = computed<PremiumTierInfo | undefined>(() => get(tiersInformation)[0]);

const monthlyPrice = computed<string | undefined>(() => get(basicTier)?.monthlyPlan?.price);

const features = computed<PremiumTierInfoDescription[]>(() => get(basicTier)?.description.slice(0, 4) || []);

const isLoading = computed<boolean>(() => get(tiersInformation).length === 0);
</script>

<template>
  <RuiCard class="!border-l-4 !border-l-rui-primary">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <div
          class="rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br from-rui-primary/10 to-rui-primary/5 shrink-0"
        >
          <AppLogo size="2" />
        </div>
        <div class="flex-1">
          <div class="text-h6 font-bold">
            {{ t('navigation_menu.rotki_premium') }}
          </div>
          <div class="text-body-2 text-rui-text-secondary">
            {{ t('account.no_premium.tagline') }}
          </div>
        </div>
      </div>

      <!-- Features List -->
      <div>
        <div class="text-body-2 text-rui-text-secondary mb-3">
          {{ t('account.no_premium.features_starting_from') }}
        </div>
        <div class="grid gap-2">
          <template v-if="isLoading">
            <div
              v-for="i in 4"
              :key="i"
              class="flex items-start gap-2"
            >
              <RuiSkeletonLoader
                class="h-4 w-4 mt-0.5 shrink-0"
                rounded="sm"
              />
              <div class="flex-1 flex items-baseline gap-1.5">
                <RuiSkeletonLoader class="h-4 w-32" />
                <RuiSkeletonLoader class="h-4 w-24" />
              </div>
            </div>
          </template>
          <template v-else-if="features.length > 0">
            <div
              v-for="feature in features"
              :key="feature.label"
              class="flex items-start gap-2 text-body-2"
            >
              <RuiIcon
                name="lu-check"
                size="16"
                class="text-rui-success mt-0.5 shrink-0"
              />
              <div class="flex items-baseline gap-1.5">
                <span>{{ feature.label }}:</span>
                <span class="font-medium">{{ feature.value }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row gap-3">
        <NuxtLink
          to="/checkout/pay"
          class="sm:flex-1"
        >
          <RuiButton
            color="primary"
            size="lg"
            class="w-full"
          >
            <template #prepend>
              <RuiIcon
                name="lu-sparkles"
                size="20"
              />
            </template>
            <span class="flex items-center gap-2">
              {{ t('account.no_premium.upgrade_now') }}
              <span
                v-if="monthlyPrice"
                class="text-xs opacity-90"
              >
                {{ t('account.no_premium.upgrade_from', { price: monthlyPrice }) }}
              </span>
            </span>
          </RuiButton>
        </NuxtLink>
        <NuxtLink
          to="/pricing"
          class="sm:flex-1"
        >
          <RuiButton
            variant="outlined"
            color="primary"
            size="lg"
            class="w-full"
          >
            {{ t('account.no_premium.view_all_plans') }}
          </RuiButton>
        </NuxtLink>
      </div>
    </div>
  </RuiCard>
</template>
