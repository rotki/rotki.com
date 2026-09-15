<script setup lang="ts">
import AccountCreditHistoryTable from '~/components/account/home/AccountCreditHistoryTable.vue';
import { useCredit } from '~/composables/account/use-credit';
import { formatCurrency } from '~/utils/text';

const { t } = useI18n({ useScope: 'global' });

const historyOpen = ref<number[]>([]);

const { balance, hasHistory, history, initialLoading, load, loading } = useCredit();

function formatCreditAmount(value: string): string {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : value;
}

function formatEur(value: string): string {
  return t('account.credit.balance_eur', { amount: formatCreditAmount(value) });
}

onMounted(load);
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-h6 mb-6">
      {{ t('account.credit.title') }}
      <RuiButton
        variant="text"
        color="primary"
        icon
        :loading="loading"
        :disabled="initialLoading"
        class="!p-2"
        @click="load()"
      >
        <RuiIcon
          name="lu-refresh-cw"
          size="16"
        />
      </RuiButton>
    </div>

    <RuiCard
      variant="flat"
      class="!bg-rui-grey-50 dark:!bg-rui-grey-900 p-1 border border-rui-grey-300 dark:border-rui-grey-800"
    >
      <div
        v-if="initialLoading"
        class="space-y-4"
      >
        <RuiSkeletonLoader class="h-4 w-full max-w-xl" />
        <RuiSkeletonLoader class="h-6 w-48" />
        <RuiSkeletonLoader class="h-16 w-full" />
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="text-body-2 text-rui-text-secondary">
          {{ t('account.credit.description') }}
        </div>

        <div class="flex items-center gap-3">
          <RuiIcon
            name="lu-coins"
            size="20"
            class="text-rui-primary"
          />
          <span class="text-rui-text-secondary text-body-2">{{ t('account.credit.balance') }}:</span>
          <span class="text-h6 font-bold text-rui-primary">
            {{ formatEur(balance) }}
          </span>
        </div>

        <RuiAlert
          type="info"
          icon="lu-info"
          class="border border-rui-info/[0.5]"
        >
          {{ t('account.credit.disclaimer') }}
        </RuiAlert>

        <RuiAccordions
          v-if="hasHistory"
          v-model="historyOpen"
        >
          <RuiAccordion>
            <template #header>
              <span class="text-body-2 font-medium">{{ t('account.credit.history.title') }}</span>
            </template>

            <div class="pt-3">
              <AccountCreditHistoryTable :rows="history" />
            </div>
          </RuiAccordion>
        </RuiAccordions>

        <div
          v-else
          class="flex items-center gap-2 text-body-2 text-rui-text-secondary"
        >
          <RuiIcon
            name="lu-clock"
            size="16"
            class="text-rui-text-disabled"
          />
          {{ t('account.credit.empty_history') }}
        </div>
      </div>
    </RuiCard>
  </div>
</template>
