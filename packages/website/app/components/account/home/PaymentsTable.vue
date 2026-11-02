<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type {
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { UserPayment } from '~/types/account';
import { get } from '@vueuse/shared';
import AccountSection from '~/components/account/home/AccountSection.vue';
import PaymentAmountCell from '~/components/account/home/PaymentAmountCell.vue';
import RefreshButton from '~/components/account/home/RefreshButton.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useUserPayments } from '~/composables/account/use-user-payments';
import { formatDate } from '~/utils/date';
import { invoiceUrl, PAID_USING_CARD } from '~/utils/payments';
import { getPlanNameFor } from '~/utils/plans';
import { fitsOnePage, SINGLE_LINE_ROWS } from '~/utils/table';
import { toTitleCase } from '~/utils/text';

const { pending } = defineProps<{
  pending: UserSubscription[];
}>();

const { t } = useI18n({ useScope: 'global' });

const pagination = ref<TablePaginationData>();

/** A payment with its method as shown, so the column sorts the way it reads. */
type PaymentRow = UserPayment & { method: string };

const sort = ref<DataTableSortColumn<PaymentRow>>({
  column: 'paidAt',
  direction: 'desc',
});

const { userPayments, loading, refresh } = useUserPayments();

const headers: DataTableColumn<PaymentRow>[] = [{
  label: t('account.payments.headers.paid_at'),
  key: 'paidAt',
  cellClass: 'whitespace-nowrap',
  sortable: true,
}, {
  label: t('common.plan'),
  key: 'plan',
  cellClass: 'font-medium',
  class: '[&_button]:capitalize',
  sortable: true,
}, {
  label: t('account.payments.headers.method'),
  key: 'method',
  sortable: true,
}, {
  label: t('account.payments.headers.paid_amount'),
  key: 'eurAmount',
  sortable: true,
  align: 'end',
}, {
  label: t('common.status'),
  key: 'isRefund',
  class: '[&_button]:capitalize',
  sortable: true,
}, {
  label: t('account.payments.headers.invoice'),
  key: 'actions',
  align: 'end',
}];

/** The backend sends the `PaidVia` enum name; anything new falls back to a readable form of it. */
function methodLabel(paidUsing: string): string {
  switch (paidUsing) {
    case PAID_USING_CARD:
      return t('common.card');
    case 'PAYPAL':
      return t('account.payments.methods.paypal');
    case 'CRYPTO':
      return t('account.payments.methods.crypto');
    case 'BANK_TRANSFER':
      return t('account.payments.methods.bank_transfer');
    default:
      return toTitleCase(paidUsing);
  }
}

const rows = computed<PaymentRow[]>(() => get(userPayments).map(payment => ({
  ...payment,
  method: payment.referralCreditAppliedEur > 0
    ? t('account.payments.method_with_credit', { method: methodLabel(payment.paidUsing) })
    : methodLabel(payment.paidUsing),
})));

watch(() => pending, (pendingIs, pendingWas) => {
  if (pendingIs.length === 0 && pendingWas.length > 0) {
    refresh();
  }
});
</script>

<template>
  <AccountSection
    :title="t('account.payments.title')"
    :description="t('account.payments.description')"
  >
    <template #actions>
      <RefreshButton
        :loading="loading"
        @refresh="refresh()"
      />
    </template>
    <RuiDataTable
      v-model:pagination="pagination"
      v-model:sort="sort"
      :class="SINGLE_LINE_ROWS"
      :cols="headers"
      :loading="loading"
      :empty="{ description: t('account.payments.no_payments_found') }"
      row-attr="identifier"
      :rows="rows"
      :hide-pagination="fitsOnePage(rows)"
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
            class="text-caption leading-3.5 text-rui-text-secondary whitespace-nowrap"
          >
            {{ t('account.payments.upgraded_from', { plan: toTitleCase(row.originalPlan) }) }}
          </div>
        </template>
      </template>
      <template #item.paidAt="{ row }">
        {{ formatDate(row.paidAt, 'MMM DD, YYYY') }}
      </template>
      <template #item.eurAmount="{ row }">
        <PaymentAmountCell :payment="row" />
      </template>
      <template #item.isRefund="{ row }">
        <RuiChip
          size="sm"
          variant="tonal"
          :color="row.isRefund ? 'info' : 'success'"
        >
          {{ row.isRefund ? t("account.payments.refunded") : t("account.payments.paid") }}
        </RuiChip>
      </template>

      <template #item.actions="{ row }">
        <ButtonLink
          :to="invoiceUrl(row)"
          color="primary"
          external
          inline
        >
          {{ t('account.overview.invoice') }}
        </ButtonLink>
      </template>
    </RuiDataTable>
  </AccountSection>
</template>
