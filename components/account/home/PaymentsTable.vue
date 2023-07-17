<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';
import { type DataTableHeader } from '~/types/common';

const headers: DataTableHeader[] = [
  { text: 'Plan', value: '' },
  { text: 'Paid at', value: '', sortable: true },
  { text: 'Amount in €', value: '', sortable: true },
  { text: 'Status', value: '' },
  { text: 'Receipt', value: '', className: 'text-right' },
];

const store = useMainStore();
const { account } = storeToRefs(store);
const payments = computed(() => {
  const userAccount = get(account);
  if (!userAccount) {
    return [];
  }
  return userAccount.payments.sort(
    (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
  );
});

const css = useCssModule();
</script>

<template>
  <DataTable v-if="payments.length > 0" :headers="headers" :items="payments">
    <template #title>Your latest payments</template>
    <template #item="{ item }">
      <td :class="css.td">
        {{ item.plan }}
      </td>
      <td :class="css.td">
        <div :class="css.text">
          {{ item.paidAt }}
        </div>
      </td>
      <td :class="css.td">
        <div :class="css.text">
          {{ item.eurAmount }}
        </div>
      </td>

      <td :class="css.td">
        <div :class="css.text">Paid</div>
      </td>
      <td :class="css.action">
        <div :class="css.actionContainer">
          <a
            :class="css.actionButton"
            :href="`/webapi/download/receipt/${item.identifier}`"
            target="_blank"
            download
          >
            <InfoTooltip>
              <template #activator>
                <ReceiptIcon />
              </template>
              Download Receipt
            </InfoTooltip>
          </a>
        </div>
      </td>
    </template>
  </DataTable>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';

.td {
  @apply px-6 py-4 whitespace-nowrap;
}

.text {
  @apply text-sm text-gray-500;
}

.action {
  @apply px-6 py-4 whitespace-nowrap text-right text-sm font-medium;
}

.actionContainer {
  @apply flex flex-row-reverse;
}

.actionButton {
  @apply text-primary hover:text-yellow-600;
}
</style>
