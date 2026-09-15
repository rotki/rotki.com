<script setup lang="ts">
import type { DataTableColumn } from '@rotki/ui-library';
import type { CreditEntry } from '~/types/account';
import { formatDate } from '~/utils/date';
import { formatCurrency } from '~/utils/text';

defineProps<{
  rows: readonly CreditEntry[];
}>();

const { t } = useI18n({ useScope: 'global' });

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

function formatEur(value: string): string {
  return t('account.credit.balance_eur', { amount: formatCreditAmount(value) });
}

function isCredit(value: string): boolean {
  return Number.parseFloat(value) >= 0;
}

function formatSignedAmount(value: string): string {
  const formatted = formatEur(value);
  return isCredit(value) ? `+${formatted}` : formatted;
}

function formatEntryType(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
</script>

<template>
  <RuiDataTable
    :cols="cols"
    :rows="rows"
    row-attr="createdAt"
    outlined
    dense
    hide-default-footer
  >
    <template #item.entryType="{ row }">
      <RuiChip
        size="sm"
        :color="isCredit(row.amountEur) ? 'success' : 'grey'"
        variant="outlined"
      >
        {{ formatEntryType(row.entryType) }}
      </RuiChip>
    </template>
    <template #item.amountEur="{ row }">
      <span
        class="font-medium"
        :class="isCredit(row.amountEur) ? 'text-rui-success' : 'text-rui-error'"
      >
        {{ formatSignedAmount(row.amountEur) }}
      </span>
    </template>
    <template #item.balanceAfterEur="{ row }">
      {{ formatEur(row.balanceAfterEur) }}
    </template>
    <template #item.createdAt="{ row }">
      {{ formatDate(row.createdAt) }}
    </template>
    <template #item.notes="{ row }">
      <span class="text-rui-text-secondary">{{ row.notes || '–' }}</span>
    </template>
  </RuiDataTable>
</template>
