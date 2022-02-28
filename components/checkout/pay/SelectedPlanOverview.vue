<template>
  <plan-overview>
    {{ name }} Plan. Starting from ({{ date }}) {{ plan.finalPriceInEur }}€ ({{
      plan.priceInEur
    }}€ <span v-if="plan.vat">+ {{ plan.vat }}% VAT</span>) every
    {{ plan.months }} months

    <template #body>
      <div :class="$style.change" @click="select">Change</div>
      <change-plan-dialog
        :visible="selection"
        @cancel="selection = false"
        @select="switchTo($event)"
      />
    </template>
  </plan-overview>
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
import { get, set } from '@vueuse/core'
import { SelectedPlan } from '~/types'
import { getPlanName } from '~/components/checkout/plan/utils'

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
    const router = useRouter()

    const selection = ref(false)

    const name = computed(() => getPlanName(get(plan).months))
    const date = computed(() => {
      return new Date(get(plan).dateNow * 1000).toLocaleDateString()
    })

    const select = () => {
      set(selection, true)
    }

    const switchTo = (months: number) => {
      set(selection, false)
      const currentRoute = router.currentRoute

      router.push({
        path: currentRoute.path,
        query: {
          p: months.toString(),
        },
      })
    }

    return {
      name,
      date,
      selection,
      select,
      getPlanName,
      switchTo,
    }
  },
})
</script>

<style lang="scss" module>
.change {
  @apply font-bold;

  line-height: 19px;
  font-size: 16px;
  letter-spacing: 0;
  color: #351404;
}
</style>
