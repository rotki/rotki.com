<script setup lang="ts">
import type { UserPayment } from '~/types/account';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useCredit } from '~/composables/account/use-credit';
import { useUserDevices } from '~/composables/account/use-user-devices';
import { useUserPayments } from '~/composables/account/use-user-payments';
import { useMainStore } from '~/store';
import { formatDate } from '~/utils/date';
import { invoiceUrl } from '~/utils/payments';
import { formatCurrency, formatDecimalString } from '~/utils/text';

const { t } = useI18n({ useScope: 'global' });

/** Credit and referrals need a confirmed e-mail address, as on Billing. */
const { account } = storeToRefs(useMainStore());
const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? false);

const { userDevices, loading: devicesLoading } = useUserDevices();
const { balance, initialLoading: creditLoading, load: loadCredit } = useCredit();
const { userPayments, loading: paymentsLoading } = useUserPayments();

/** The newest payment, refunds left out: those are not something the user paid. */
const lastPayment = computed<UserPayment | undefined>(() =>
  get(userPayments).reduce<UserPayment | undefined>((latest, payment) => {
    if (payment.isRefund)
      return latest;
    return !latest || Date.parse(payment.paidAt) > Date.parse(latest.paidAt) ? payment : latest;
  }, undefined),
);

const creditText = computed<string>(() => t('account.credit.balance_eur', { amount: formatDecimalString(get(balance)) }));

onMounted(async () => {
  if (get(emailConfirmed))
    await loadCredit();
});
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <NuxtLink
      to="/home/devices"
      class="group rounded-lg border border-default p-5 flex flex-col gap-1 transition-colors hover:border-rui-primary/40 focus-visible:outline-2 focus-visible:outline-rui-primary"
    >
      <span class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
        {{ t('account.overview.devices') }}
      </span>
      <RuiSkeletonLoader
        v-if="devicesLoading && userDevices.length === 0"
        class="h-8 w-24"
      />
      <span
        v-else
        class="text-h5 text-rui-text tabular-nums"
      >
        {{ t('account.overview.devices_connected', { count: userDevices.length }, userDevices.length) }}
      </span>
      <span class="mt-1 text-body-2 font-medium text-rui-primary group-hover:underline">
        {{ t('account.overview.manage_devices') }}
      </span>
    </NuxtLink>

    <NuxtLink
      v-if="emailConfirmed"
      to="/home/billing"
      external
      class="group rounded-lg border border-default p-5 flex flex-col gap-1 transition-colors hover:border-rui-primary/40 focus-visible:outline-2 focus-visible:outline-rui-primary"
    >
      <span class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
        {{ t('account.credit.balance') }}
      </span>
      <RuiSkeletonLoader
        v-if="creditLoading"
        class="h-8 w-24"
      />
      <span
        v-else
        class="text-h5 text-rui-text tabular-nums"
      >
        {{ creditText }}
      </span>
      <span class="mt-1 text-body-2 font-medium text-rui-primary group-hover:underline">
        {{ t('account.overview.refer_a_friend') }}
      </span>
    </NuxtLink>

    <div class="rounded-lg border border-default p-5 flex flex-col gap-1">
      <span class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
        {{ t('account.overview.last_payment') }}
      </span>
      <RuiSkeletonLoader
        v-if="paymentsLoading && !lastPayment"
        class="h-8 w-24"
      />
      <template v-else-if="lastPayment">
        <span class="text-h5 text-rui-text tabular-nums">
          {{ t('account.credit.balance_eur', { amount: formatCurrency(lastPayment.eurAmount) }) }}
        </span>
        <span class="mt-1 text-body-2 text-rui-text-secondary">
          {{ formatDate(lastPayment.paidAt, 'MMM DD, YYYY') }} ·
          <ButtonLink
            :to="invoiceUrl(lastPayment)"
            color="primary"
            external
            inline
          >
            {{ t('account.overview.invoice') }}
          </ButtonLink>
        </span>
      </template>
      <span
        v-else
        class="text-body-1 text-rui-text-secondary"
      >
        {{ t('account.overview.no_payments') }}
      </span>
    </div>
  </div>
</template>
