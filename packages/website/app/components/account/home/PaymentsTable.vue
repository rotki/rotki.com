<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type {
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { UserPayment } from '~/types/account';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useUserPayments } from '~/composables/account/use-user-payments';
import { formatDate } from '~/utils/date';
import { discountAmount } from '~/utils/money';
import { getPlanNameFor } from '~/utils/plans';
import { toTitleCase } from '~/utils/text';

const props = defineProps<{
  pending: UserSubscription[];
}>();

const { t } = useI18n({ useScope: 'global' });

const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<UserPayment>>({
  column: 'paidAt',
  direction: 'desc',
});

const { userPayments, loading, refresh } = useUserPayments();

const headers: DataTableColumn<UserPayment>[] = [{
  label: t('common.plan'),
  key: 'plan',
  cellClass: 'font-bold',
  class: '[&_button]:capitalize',
  sortable: true,
}, {
  label: t('account.payments.headers.paid_at'),
  key: 'paidAt',
  sortable: true,
}, {
  label: t('account.payments.headers.method'),
  key: 'paidUsing',
  sortable: true,
}, {
  label: t('account.payments.headers.paid_amount'),
  key: 'finalPrice',
  sortable: true,
  align: 'end',
}, {
  label: t('common.status'),
  key: 'status',
  class: '[&_button]:capitalize',
  sortable: true,
}, {
  label: t('common.actions'),
  key: 'actions',
  class: 'capitalize',
}];

watch(() => props.pending, (pendingIs, pendingWas) => {
  if (pendingIs.length === 0 && pendingWas.length > 0) {
    refresh();
  }
});
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-h6 mb-6">
      {{ t('account.payments.title') }}
      <RuiButton
        variant="text"
        color="primary"
        icon
        :loading="loading"
        class="!p-2"
        @click="refresh()"
      >
        <RuiIcon
          name="lu-refresh-cw"
          size="16"
        />
      </RuiButton>
    </div>
    <RuiDataTable
      v-model:pagination="pagination"
      v-model:sort="sort"
      :cols="headers"
      :loading="loading"
      :empty="{ description: t('account.payments.no_payments_found') }"
      row-attr="identifier"
      :rows="userPayments"
      outlined
    >
      <template #item.plan="{ row }">
        <template v-if="row.legacy">
          -
        </template>
        <template v-else>
          <div>{{ getPlanNameFor(t, { name: row.plan, durationInMonths: row.durationInMonths }) }}</div>
          <div
            v-if="row.isUpgrade && row.originalPlan"
            class="text-[10px] leading-[1.2] text-rui-text-secondary uppercase whitespace-nowrap"
          >
            {{ t('account.payments.upgraded_from', { plan: row.originalPlan }) }}
          </div>
        </template>
      </template>
      <template #item.paidAt="{ row }">
        {{ formatDate(row.paidAt) }}
      </template>
      <template #item.finalPrice="{ row }">
        <div class="flex items-center justify-end gap-2">
          <RuiTooltip
            v-if="row.discount && row.priceBeforeDiscount"
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
                  <b>{{ discountAmount(row.priceBeforeDiscount, row.eurAmount) }}</b>
                  <template v-if="row.discount.type === DiscountType.PERCENTAGE">
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
          {{ row.eurAmount }} €
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
        <div class="flex flex-col items-start gap-1">
          <ButtonLink
            :to="row.legacy ? `/webapi/download/receipt/${row.identifier}/` : `/webapi/2/invoices/${row.identifier}/`"
            color="primary"
            external
          >
            <template #prepend>
              <RuiIcon
                name="lu-download"
                size="16"
              />
            </template>
            {{ t('actions.download') }}
          </ButtonLink>
        </div>
      </template>
    </RuiDataTable>
  </div>
</template>
