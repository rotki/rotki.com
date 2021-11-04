<template>
  <div :class="$style.content">
    <div :class="$style.title">Your Plan</div>
    <div :class="$style.body">
      <div :class="$style.description">
        {{ name }} Plan. Starting from ({{ date }}) {{ plan.finalPriceInEur }}€
        ({{ plan.priceInEur }}€
        <span v-if="plan.vat">+ {{ plan.vat }}% VAT</span>) every
        {{ plan.months }} months
      </div>
      <div :class="$style.change">Change</div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  toRefs,
} from '@nuxtjs/composition-api'
import { SelectedPlan } from '~/types'

export default defineComponent({
  name: 'SelectedPlanOverview',
  props: {
    plan: {
      required: true,
      type: Object as PropType<SelectedPlan>,
    },
  },

  setup(props) {
    const { plan } = toRefs(props)
    const name = computed(() => {
      if (plan.value.months === 1) {
        return 'Monthly'
      } else if (plan.value.months === 12) {
        return 'Yearly'
      } else {
        return `${plan.value.months}`
      }
    })
    const date = computed(() => {
      return new Date(plan.value.dateNow * 1000).toLocaleDateString()
    })
    return {
      name,
      date,
    }
  },
})
</script>

<style lang="scss" module>
.content {
  margin-top: 32px;
}

.body {
  @apply flex-row flex items-center;
}

.title {
  @apply text-typography;

  font-size: 18px;
  line-height: 21px;
  letter-spacing: 0;
}

.description {
  @apply text-typography;

  padding-top: 8px;
  font-size: 15px;
  line-height: 21px;
  opacity: 0.78;
  max-width: 288px;
}

.change {
  @apply font-bold;

  line-height: 19px;
  font-size: 16px;
  letter-spacing: 0;
  color: #351404;
}
</style>
