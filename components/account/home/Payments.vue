<template>
  <data-table :headers="headers" :items="payments">
    <template #title>Your latest payments</template>
    <template #item="{ item }">
      <td :class="$style.td">
        {{ item.plan }}
      </td>
      <td :class="$style.td">
        <div :class="$style.text">
          {{ item.paidAt }}
        </div>
      </td>
      <td :class="$style.td">
        <div :class="$style.text">
          {{ item.eurAmount }}
        </div>
      </td>

      <td :class="$style.td">
        <div :class="$style.text">Paid</div>
      </td>
      <td :class="$style.action">
        <div :class="$style.actionContainer">
          <a
            :class="$style.actionButton"
            :href="`/webapi/download/receipt/${item.identifier}`"
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
    </template>
  </data-table>
</template>

<script lang="ts">
import { computed, defineComponent, useStore } from '@nuxtjs/composition-api'
import { RootState } from '~/store'
import { DataTableHeader } from '~/components/common/DataTable.vue'

const headers: DataTableHeader[] = [
  { text: 'Plan', value: '' },
  { text: 'Paid at', value: '', sortable: true },
  { text: 'Amount in €', value: '', sortable: true },
  { text: 'Status', value: '' },
  { text: 'Receipt', value: '', className: 'text-right' },
]

export default defineComponent({
  name: 'Payments',
  setup() {
    const store = useStore<RootState>()
    const payments = computed(() => {
      if (!store.state.account) {
        return []
      }
      return store.state.account.payments
    })

    return {
      headers,
      payments,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

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
