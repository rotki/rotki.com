<template>
  <div>
    <div :class="$style.price">Price</div>
    <div :class="$style.description">
      Depending on customer's country of residence an additional +19% VAT tax
      may be applicable.
    </div>
    <div :class="$style.selection">
      <selectable-plan
        v-for="plan in plans"
        :key="plan.months"
        :plan="plan"
        :selected="isSelected(plan)"
        @click="selected = plan"
      />
    </div>

    <div :class="$style.hint">
      <span v-if="selected">
        * When paying with crypto the monthly price is
        {{ cryptoPrice }} €
      </span>
    </div>

    <div :class="$style.continue">
      <selection-button selected @click="next">Continue</selection-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  useRouter,
} from '@nuxtjs/composition-api'
import { Plan } from '~/types'

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
          p: selected.value!.months.toString(),
        },
      })
    }

    return {
      next,
      cryptoPrice,
      isSelected,
      selected,
    }
  },
})
</script>

<style lang="scss" module>
$text-color: #212529;
.selection {
  @apply flex flex-row content-between container;
}

.selection > * {
  margin-left: 32px;
  margin-right: 32px;
}

.text {
  letter-spacing: 0;
  color: $text-color;
}

.price {
  font-size: 28px;
  line-height: 33px;

  @extend .text;
}

.description {
  @apply mt-2 mb-12;

  font-size: 15px;
  line-height: 19px;

  @extend .text;
}

.hint {
  @apply mt-2;

  height: 21px;
  line-height: 21px;
  font-size: 15px;
  font-style: italic;

  @extend .text;
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 180px;
  }
}
</style>
