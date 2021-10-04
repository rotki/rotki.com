<template>
  <div :class="$style.col">
    <div :class="$style.row">
      <div :class="$style.heading">Your latest payments</div>
      <div :class="$style.tableWrapper">
        <table :class="$style.table">
          <thead :class="$style.thead">
            <tr>
              <th :class="$style.header" scope="col">Plan</th>
              <th :class="$style.header" scope="col">Paid at</th>
              <th :class="$style.header" scope="col">Amount in €</th>
              <th :class="$style.header" scope="col">Status</th>
              <th
                :class="{
                  [$style.header]: true,
                  [$style.last]: true,
                }"
                scope="col"
              >
                Receipt
              </th>
            </tr>
          </thead>
          <tbody :class="$style.tbody">
            <tr v-for="(payment, index) in payments" :key="index">
              <td :class="$style.td">
                {{ payment.plan }}
              </td>
              <td :class="$style.td">
                <div :class="$style.text">
                  {{ payment.paidAt }}
                </div>
              </td>
              <td :class="$style.td">
                <div :class="$style.text">
                  {{ payment.eurAmount }}
                </div>
              </td>

              <td :class="$style.td">
                <div :class="$style.text">Paid</div>
              </td>
              <td :class="$style.action">
                <div :class="$style.actionContainer">
                  <a
                    :class="$style.actionButton"
                    :href="`/webapi/download/receipt/${payment.identifier}`"
                    download
                  >
                    <tooltip>
                      <template #activator>
                        <receipt />
                      </template>
                      Download Receipt
                    </tooltip>
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, useStore } from '@nuxtjs/composition-api'
import { RootState } from '~/store'

export default defineComponent({
  name: 'Subscriptions',
  setup() {
    const store = useStore<RootState>()
    const payments = computed(() => {
      if (!store.state.account) {
        return []
      }
      return store.state.account.payments
    })

    return {
      payments,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

.table {
  @apply min-w-full divide-y divide-gray-200;
}

.header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.last {
  @apply text-right;
}

.heading {
  @apply font-serif text-shade11 mb-4;

  @include text-size(20px, 28px);
}

.actionHeader {
  @apply relative px-6 py-3;
}

.col {
  @apply flex flex-col;
}

.row {
  @apply py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8;
}

.tableWrapper {
  @apply shadow overflow-hidden border-b border-gray-200 sm:rounded-lg;
}

.thead {
  @apply bg-gray-50;
}

.tbody {
  @apply bg-white divide-y divide-gray-200;
}

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
  @apply text-indigo-600 hover:text-indigo-900;
}

.status {
  @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full;
}

.active {
  @apply bg-green-100 text-green-800;
}

.cancelled {
  @apply bg-red-100 text-red-600;
}

.pending {
  @apply bg-yellow-100 text-yellow-600;
}

.pastDue {
  @apply bg-yellow-300 text-yellow-800;
}
</style>
