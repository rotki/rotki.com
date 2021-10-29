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

    <div :class="$style.continue">
      <selection-button selected @click="next">Continue</selection-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  toRefs,
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
  setup(props) {
    const { plans } = toRefs(props)
    const selected = ref(plans.value[0])
    const isSelected = (plan: Plan) => plan === selected.value

    const router = useRouter()
    const next = () => {
      router.push('/checkout/payment-method')
    }
    return {
      next,
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

.price {
  font-size: 28px;
  line-height: 33px;
  letter-spacing: 0;
  color: $text-color;
}

.description {
  @apply mt-2 mb-12;

  font-size: 15px;
  line-height: 19px;
  letter-spacing: 0;
  color: $text-color;
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 180px;
  }
}
</style>
