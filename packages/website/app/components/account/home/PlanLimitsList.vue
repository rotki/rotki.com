<script setup lang="ts">
import type { PremiumTierInfoDescription } from '~/types/tiers';
import { get } from '@vueuse/shared';

const { limits } = defineProps<{
  limits: PremiumTierInfoDescription[];
}>();

const { t } = useI18n({ useScope: 'global' });

const showAllLimits = ref<boolean>(false);

const displayedLimits = computed<PremiumTierInfoDescription[]>(() => {
  const showAll = get(showAllLimits);

  if (showAll || limits.length <= 4) {
    return limits;
  }

  return limits.slice(0, 4);
});

const hasMoreLimits = computed<boolean>(() => limits.length > 4);

function formatLimitValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? t('account.subscriptions.included') : t('account.subscriptions.not_included');
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}
</script>

<template>
  <div v-if="limits.length > 0">
    <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
      {{ t('account.subscriptions.plan_limits') }}
    </p>
    <dl class="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="limit in displayedLimits"
        :key="limit.label"
        class="min-w-0"
      >
        <dt class="text-body-2 text-rui-text-secondary">
          {{ limit.label }}
        </dt>
        <dd class="mt-0.5 flex items-center gap-1.5 text-body-2 font-medium text-rui-text">
          <RuiIcon
            v-if="typeof limit.value === 'boolean'"
            :name="limit.value ? 'lu-circle-check' : 'lu-minus'"
            size="16"
            :class="limit.value ? 'text-rui-success' : 'text-rui-text-secondary'"
          />
          {{ formatLimitValue(limit.value) }}
        </dd>
      </div>
    </dl>

    <RuiButton
      v-if="hasMoreLimits"
      variant="text"
      color="primary"
      size="sm"
      class="mt-2 -ml-2"
      @click="showAllLimits = !showAllLimits"
    >
      <template #prepend>
        <RuiIcon
          :name="showAllLimits ? 'lu-chevron-up' : 'lu-chevron-down'"
          size="16"
        />
      </template>
      {{ showAllLimits ? t('common.show_less') : t('common.show_more') }}
    </RuiButton>
  </div>
</template>
