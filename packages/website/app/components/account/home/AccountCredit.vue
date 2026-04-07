<script setup lang="ts">
import type { DataTableColumn } from '@rotki/ui-library';
import type { CreditEntry } from '~/types/account';
import { useCredit } from '~/composables/account/use-credit';
import { formatDate } from '~/utils/date';
import { formatCurrency } from '~/utils/text';

const { t } = useI18n({ useScope: 'global' });

const historyOpen = ref<number[]>([]);

const { balance, hasHistory, history, load, loading } = useCredit();

const cols = computed<DataTableColumn<CreditEntry>[]>(() => [
  { key: 'entryType', label: t('account.credit.history.type') },
  { key: 'amountEur', label: t('account.credit.history.amount'), align: 'end' },
  { key: 'balanceAfterEur', label: t('account.credit.history.balance_after'), align: 'end' },
  { key: 'createdAt', label: t('account.credit.history.date') },
  { key: 'notes', label: t('account.credit.history.notes') },
]);

function formatCreditAmount(value: string): string {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : value;
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
      <div class="space-y-4">
        <div class="text-body-2 text-rui-text-secondary">
          {{ t('account.credit.description') }}
        </div>

        <div class="flex items-center gap-3">
          <span class="text-rui-text-secondary text-body-2">{{ t('account.credit.balance') }}:</span>
          <span class="text-h6 font-bold text-rui-primary">
            {{ t('account.credit.balance_eur', { amount: formatCreditAmount(balance) }) }}
          </span>
        </div>

        <RuiAccordions v-model="historyOpen">
          <RuiAccordion>
            <template #header>
              <span class="text-body-2 font-medium">{{ t('account.credit.history.title') }}</span>
            </template>

            <div
              v-if="!hasHistory"
              class="text-body-2 text-rui-text-secondary py-2"
            >
              {{ t('account.credit.empty_history') }}
            </div>

            <RuiDataTable
              v-else
              :cols="cols"
              :rows="history"
              row-attr="createdAt"
              outlined
              dense
            >
              <template #item.amountEur="{ row }">
                <span :class="Number.parseFloat(row.amountEur) >= 0 ? 'text-rui-success' : 'text-rui-error'">
                  {{ formatCreditAmount(row.amountEur) }} €
                </span>
              </template>
              <template #item.balanceAfterEur="{ row }">
                {{ formatCreditAmount(row.balanceAfterEur) }} €
              </template>
              <template #item.createdAt="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
              <template #item.notes="{ row }">
                <span class="text-rui-text-secondary">{{ row.notes }}</span>
              </template>
            </RuiDataTable>
          </RuiAccordion>
        </RuiAccordions>
      </div>
    </RuiCard>
  </div>
</template>
