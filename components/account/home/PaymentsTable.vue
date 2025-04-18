<script lang="ts" setup>
import type {
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { Payment } from '~/types';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const { t } = useI18n({ useScope: 'global' });

const headers: DataTableColumn<Payment>[] = [
  {
    label: t('common.plan'),
    key: 'plan',
    cellClass: 'font-bold',
    class: 'capitalize',
  },
  {
    label: t('account.payments.headers.paid_at'),
    key: 'paidAt',
    sortable: true,
  },
  {
    label: t('account.payments.headers.amount_in_symbol', { symbol: '€' }),
    key: 'eurAmount',
    sortable: true,
    align: 'end',
  },
  { label: t('common.status'), key: 'isRefund', class: 'capitalize' },
  {
    label: t('common.actions'),
    key: 'actions',
    align: 'end',
    class: 'capitalize',
  },
];

const store = useMainStore();
const { account } = storeToRefs(store);

const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<Payment>[]>([]);

const payments = computed(() => {
  const userAccount = get(account);
  if (!userAccount)
    return [];

  return userAccount.payments.sort(
    (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
  );
});
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.payments.title') }}
    </div>
    <RuiDataTable
      v-model:pagination="pagination"
      v-model:sort="sort"
      :cols="headers"
      :empty="{ description: t('account.payments.no_payments_found') }"
      :rows="payments"
      outlined
      row-attr="identifier"
    >
      <template #item.isRefund="{ row }">
        <RuiChip
          size="sm"
          :color="row.isRefund ? 'info' : 'success'"
        >
          {{ row.isRefund ? t("account.payments.refunded") : t("account.payments.paid") }}
        </RuiChip>
      </template>

      <template #item.actions="{ row }">
        <div class="flex gap-2 justify-end">
          <ButtonLink
            :to="`/webapi/download/receipt/${row.identifier}/`"
            color="primary"
            external
          >
            <template #prepend>
              <RuiIcon
                name="lu-download"
                size="20"
              />
            </template>
            {{ t('actions.download') }}
          </ButtonLink>
        </div>
      </template>
    </RuiDataTable>
  </div>
</template>
