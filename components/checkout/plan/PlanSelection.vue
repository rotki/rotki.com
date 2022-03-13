<template>
  <div :class="$style.container">
    <checkout-title>Price</checkout-title>
    <checkout-description>
      <span v-if="!vat">
        Depending on customer's country of residence an additional +19% VAT tax
        may be applicable.
      </span>
      <span v-else>The prices include a +{{ vat }}% VAT tax</span>
    </checkout-description>

    <div :class="$style.selection">
      <div :class="$style.selectable">
        <selectable-plan
          v-for="plan in plans"
          :key="plan.months"
          :plan="plan"
          :selected="isSelected(plan)"
          @click="selected = plan"
        />
      </div>
    </div>

    <div :class="$style.hint">
      <span v-if="selected">
        * When paying with crypto the monthly price is
        {{ cryptoPrice }} €
      </span>
    </div>

    <div :class="$style.continue">
      <selection-button :disabled="!selected" selected @click="next">
        Continue
      </selection-button>
    </div>

    <div class="mt-8">
      <heading secondary class="mb-4">Notes</heading>
      <ul :class="$style.notes">
        <li>
          The selected payment method will be billed the total amount for the
          subscription immediately.
        </li>
        <li>
          New billing cycle starts at UTC midnight after the subscription has
          ran out.
        </li>
        <li>
          An invoice is generated for each payment and you can access it from
          your account page.
        </li>
        <li>
          Subscriptions can be canceled from the account page at any point in
          time.
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  toRefs,
  useRouter,
} from '@nuxtjs/composition-api'
import { Plan } from '~/types'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'PlanSelection',
  props: {
    plans: {
      required: true,
      type: Array as PropType<Plan[]>,
    },
  },
  setup() {
    const selected = ref<Plan | null>(null)
    const isSelected = (plan: Plan) => plan === selected.value

    const cryptoPrice = computed(() => {
      const plan = selected.value
      if (!plan) {
        return 0
      }
      return (parseFloat(plan.priceCrypto) / plan.months).toFixed(2)
    })

    const router = useRouter()
    const next = () => {
      router.push({
        path: '/checkout/payment-method',
        query: {
          p: selected.value?.months.toString(),
        },
      })
    }

    const store = useMainStore()
    // pinia#852
    const { account } = toRefs(store)
    const vat = computed(() => {
      return account.value?.vat
    })

    return {
      next,
      cryptoPrice,
      vat,
      isSelected,
      selected,
    }
  },
})
</script>

<style lang="scss" module>
.container {
  @apply w-full;
}

.selection {
  @apply flex flex-row w-full justify-center;
}

.selectable {
  @apply w-full lg:w-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8;
}

.hint {
  @apply mt-4 text-base italic h-5 text-typography;
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 180px;
  }
}

.notes {
  @apply list-disc pl-6;
}
</style>
