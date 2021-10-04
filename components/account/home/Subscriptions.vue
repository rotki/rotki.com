<template>
  <div :class="$style.col">
    <div :class="$style.row">
      <div :class="$style.heading">Subscriptions</div>
      <div :class="$style.tableWrapper">
        <table :class="$style.table">
          <thead :class="$style.thead">
            <tr>
              <th :class="$style.header" scope="col">Plan</th>
              <th :class="$style.header" scope="col">Created</th>
              <th :class="$style.header" scope="col">Next Billing</th>
              <th :class="$style.header" scope="col">Cost in € per period</th>
              <th :class="$style.header" scope="col">Status</th>
              <th :class="$style.actionHeader" scope="col">
                <span class="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody :class="$style.tbody">
            <tr v-for="(sub, index) in subscriptions" :key="index">
              <td :class="$style.td">
                {{ sub.planName }}
              </td>
              <td :class="$style.td">
                <div :class="$style.text">
                  {{ sub.createdDate }}
                </div>
              </td>
              <td :class="$style.td">
                <div :class="$style.text">
                  {{ sub.nextActionDate }}
                </div>
              </td>
              <td :class="$style.td">
                <div :class="$style.text">
                  {{ sub.nextBillingAmount }}
                </div>
              </td>
              <td :class="$style.td">
                <span
                  :class="{
                    [$style.status]: true,
                    [$style.active]: sub.status === 'Active',
                    [$style.cancelled]: sub.status === 'Cancelled',
                    [$style.pending]: sub.status === 'Pending',
                    [$style.pastDue]: sub.status === 'Past Due',
                  }"
                >
                  {{ sub.status }}
                </span>
              </td>
              <td :class="$style.action">
                <div v-if="sub.actions.length === 0">Nothing to do</div>
                <div v-else>
                  <a :class="$style.actionButton" href="#"> Cancel </a>
                  <a
                    v-if="sub.actions.includes('renew')"
                    :class="$style.actionButton"
                    href="#"
                  >
                    Renew
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
    const subscriptions = computed(() => {
      if (!store.state.account) {
        return []
      }
      return store.state.account.subscriptions
    })

    return {
      subscriptions,
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
