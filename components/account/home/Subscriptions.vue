<template>
  <div>
    <PremiumPlaceholder
      v-if="!hasActiveSubscription"
      :class="$style.purchase"
    />
    <data-table
      v-if="subscriptions.length > 0"
      :headers="headers"
      :items="subscriptions"
    >
      <template #title>Subscription History</template>
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
            <nuxt-link
              v-if="item.actions.includes('renew')"
              :class="$style.actionButton"
              :to="renewLink"
            >
              Renew
            </nuxt-link>
          </div>
        </td>
      </template>
    </data-table>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import { get, set } from '@vueuse/core'
import CancelSubscription from '~/components/account/home/CancelSubscription.vue'
import { DataTableHeader } from '~/components/common/DataTable.vue'
import { useMainStore } from '~/store'
import PremiumPlaceholder from '~/components/account/home/PremiumPlaceholder.vue'

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
  components: { PremiumPlaceholder, CancelSubscription },
  setup() {
    const store = useMainStore()
    // pinia#852
    const { account } = toRefs(store)
    const renewLink = ref<{ path: string; query: Record<string, string> }>({
      path: '/checkout/payment-method',
      query: {},
    })

    const hasActiveSubscription = computed(() => {
      return get(account)?.hasActiveSubscription
    })

    const subscriptions = computed(() => {
      const userAccount = get(account)
      if (!userAccount) {
        return []
      }
      return userAccount.subscriptions
    })

    onMounted(async () => {
      const renewableSubscriptions = get(subscriptions).filter(({ actions }) =>
        actions.includes('renew')
      )
      if (renewableSubscriptions.length) {
        const subscription = renewableSubscriptions[0]
        const result = await store.checkPendingCryptoPayment(
          subscription.identifier
        )
        if (result.isError || !result.result.pending) {
          set(renewLink, {
            path: '/checkout/payment-method',
            query: {
              p: subscription.durationInMonths.toString(),
              id: subscription.identifier,
            },
          })
        } else {
          set(renewLink, {
            path: '/checkout/pay/crypto',
            query: {
              p: subscription.durationInMonths.toString(),
              id: subscription.identifier,
              c: result.result.currency ?? '',
            },
          })
        }
      }
    })

    return {
      headers: subHeaders,
      subscriptions,
      renewLink,
      hasActiveSubscription,
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

.purchase {
  @apply mb-8;
}
</style>
