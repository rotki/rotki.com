<template>
  <data-table :headers="headers" :items="subscriptions">
    <template #title>Subscriptions</template>
    <template #item="{ item }">
      <td :class="$style.td">
        {{ item.planName }}
      </td>
      <td :class="$style.td">
        <div :class="$style.text">
          {{ item.createdDate }}
        </div>
      </td>
      <td :class="$style.td">
        <div :class="$style.text">
          {{ item.nextActionDate }}
        </div>
      </td>
      <td :class="$style.td">
        <div :class="$style.text">
          {{ item.nextBillingAmount }}
        </div>
      </td>
      <td :class="$style.td">
        <span
          :class="{
            [$style.status]: true,
            [$style.active]: item.status === 'Active',
            [$style.cancelled]: item.status === 'Cancelled',
            [$style.pending]: item.status === 'Pending',
            [$style.pastDue]: item.status === 'Past Due',
          }"
        >
          {{ item.status }}
        </span>
      </td>
      <td :class="$style.action">
        <div v-if="item.actions.length === 0">Nothing to do</div>
        <div v-else>
          <cancel-subscription :subscription="item" />
          <a
            v-if="item.actions.includes('renew')"
            :class="$style.actionButton"
            href="#"
          >
            Renew
          </a>
        </div>
      </td>
    </template>
  </data-table>
</template>

<script lang="ts">
import { computed, defineComponent, useStore } from '@nuxtjs/composition-api'
import { RootState } from '~/store'
import CancelSubscription from '~/components/account/home/CancelSubscription.vue'
import { DataTableHeader } from '~/components/common/DataTable.vue'

const subHeaders: DataTableHeader[] = [
  { text: 'Plan', value: '' },
  { text: 'Created', value: '', sortable: true },
  { text: 'Next Billing', value: '', sortable: true },
  { text: 'Cost in € per period', value: '', sortable: true },
  { text: 'Status', value: '' },
  { text: 'Actions', value: '', className: 'text-right' },
]

export default defineComponent({
  name: 'Subscriptions',
  components: { CancelSubscription },
  setup() {
    const store = useStore<RootState>()
    const subscriptions = computed(() => {
      if (!store.state.account) {
        return []
      }
      return store.state.account.subscriptions
    })

    return {
      headers: subHeaders,
      subscriptions,
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
