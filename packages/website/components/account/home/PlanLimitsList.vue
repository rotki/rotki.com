<script setup lang="ts">
import type { PremiumTierInfoDescription } from '~/types/tiers';
import { get } from '@vueuse/shared';

interface Props {
  limits: PremiumTierInfoDescription[];
}

const props = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const showAllLimits = ref<boolean>(false);

const displayedLimits = computed<PremiumTierInfoDescription[]>(() => {
  const limits = props.limits;
  const showAll = get(showAllLimits);

  if (showAll || limits.length <= 4) {
    return limits;
  }

  return limits.slice(0, 4);
});

const hasMoreLimits = computed<boolean>(() => props.limits.length > 4);

function formatLimitValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? t('common.yes') : t('common.no');
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}
</script>

<template>
  <div v-if="limits.length > 0">
    <div class="flex items-center gap-2 text-rui-text-secondary text-sm mb-2">
      <RuiIcon
        name="lu-list-checks"
        size="16"
      />
      <span>{{ t('account.subscriptions.plan_limits') }}</span>
    </div>
    <div class="space-y-2">
      <TransitionGroup
        name="limit-list"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="limit in displayedLimits"
          :key="limit.label"
          class="flex justify-between items-center text-sm gap-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          <span class="text-rui-text-secondary">{{ limit.label }}:</span>
          <template v-if="typeof limit.value === 'boolean'">
            <RuiIcon
              v-if="limit.value"
              name="lu-circle-check"
              size="20"
              color="success"
            />
            <RuiIcon
              v-else
              name="lu-minus"
              size="20"
              class="text-rui-text-secondary"
            />
          </template>
          <span
            v-else
            class="font-medium"
          >
            {{ formatLimitValue(limit.value) }}
          </span>
        </div>
      </TransitionGroup>

      <!-- Show more/less button -->
      <RuiButton
        v-if="hasMoreLimits"
        variant="text"
        size="sm"
        class="!p-0 !min-w-0 mt-2"
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
  </div>
</template>
