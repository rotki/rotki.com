<script setup lang="ts">
import type {
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { UserPayment } from '~/types/account';
import { useMainStore } from '~/store';
import { DiscountType } from '~/types/payment';
import { toTitleCase } from '~/utils/text';

const { t } = useI18n({ useScope: 'global' });

const headers: DataTableColumn<UserPayment>[] = [
  {
    label: t('account.payments.headers.paid_at'),
    key: 'paidAt',
    sortable: true,
  },
  {
    label: t('common.plan'),
    key: 'name',
    cellClass: 'font-bold',
    class: '[&_button]:capitalize',
    sortable: true,
  },
  {
    label: t('account.payments.headers.paid_amount'),
    key: 'finalPrice',
    sortable: true,
    align: 'end',
  },
  {
    label: t('account.payments.headers.method'),
    key: 'paidUsing',
    sortable: true,
  },
  {
    label: t('common.status'),
    key: 'status',
    class: '[&_button]:capitalize',
    sortable: true,
  },
  {
    label: t('common.actions'),
    key: 'actions',
    align: 'end',
    class: 'capitalize',
  },
];

const store = useMainStore();
const { userPayments } = storeToRefs(store);

const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<UserPayment>[]>([
  {
    column: 'paidAt',
    direction: 'desc',
  },
]);
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
      row-attr="identifier"
      :rows="userPayments"
      outlined
    >
      <template #item.paidAt="{ row }">
        {{ row.paidAt }}
      </template>
      <template #item.finalPrice="{ row }">
        <div class="flex items-center justify-end gap-2">
          <RuiTooltip
            v-if="row.discount"
            :open-delay="200"
          >
            <template #activator>
              <RuiIcon
                name="lu-badge-percent"
                class="text-rui-primary"
                size="18"
              />
            </template>
            <i18n-t
              keypath="account.payments.price_before_discount"
              scope="global"
              tag="div"
            >
              <template #amount>
                <b>{{ row.priceBeforeDiscount }}</b>
              </template>
            </i18n-t>
            <i18n-t
              keypath="home.plans.tiers.step_3.discount.you_save"
              scope="global"
              tag="div"
            >
              <template #amount>
                <div class="inline-flex gap-1">
                  <b>{{ row.priceBeforeDiscount - row.finalPrice }}</b>
                  <template v-if="row.discount.discountType === DiscountType.PERCENTAGE">
                    {{
                      t('home.plans.tiers.step_3.discount.percent_off', {
                        percentage: row.discount.amount,
                      })
                    }}
                  </template>
                </div>
              </template>
            </i18n-t>
          </RuiTooltip>
          € {{ row.finalPrice }}
        </div>
      </template>
      <template #item.paidUsing="{ row }">
        {{ toTitleCase(row.paidUsing) }}
      </template>
      <template #item.status="{ row }">
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
            :to="row.legacy ? `/webapi/download/receipt/${row.identifier}/` : `/webapi/2/invoices/${row.identifier}/`"
            color="primary"
            external
          >
            {{ t('actions.download') }}
          </ButtonLink>
        </div>
      </template>
    </RuiDataTable>
  </div>
</template>
