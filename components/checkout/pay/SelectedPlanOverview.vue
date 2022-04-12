<template>
  <plan-overview>
    <span :class="$style.plan">{{ name }} Plan.</span>
    <i18n path="selected_plan_overview.plan">
      <template #date>
        {{ date }}
      </template>
      <template #finalPriceInEur>
        {{ plan.finalPriceInEur }}
      </template>
      <template #vat>
        <span v-if="plan.vat && !crypto">
          {{
            $t('selected_plan_overview.vat', {
              vat: plan.vat,
              priceInEur: plan.priceInEur,
            })
          }}
        </span>
        <span v-else-if="plan.vat">
          {{
            $t('selected_plan_overview.includes_vat', {
              vat: plan.vat,
            })
          }}
        </span>
      </template>
    </i18n>
    <span>
      {{
        $tc('selected_plan_overview.renew_period', plan.months, {
          months: plan.months,
        })
      }}
    </span>

    <template #body>
      <div :class="$style.change" @click="select">Change</div>
      <change-plan-dialog
        :crypto="crypto"
        :warning="warning"
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
import { CryptoPayment, SelectedPlan } from '~/types'
import { getPlanName } from '~/utils/plans'

export default defineComponent({
  name: 'SelectedPlanOverview',
  props: {
    plan: {
      required: true,
      type: Object as PropType<SelectedPlan | CryptoPayment>,
    },
    crypto: {
      required: false,
      type: Boolean,
      default: false,
    },
    warning: {
      required: false,
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const { plan } = toRefs(props)
    const router = useRouter()

    const selection = ref(false)

    const name = computed(() => getPlanName(get(plan).months))
    const date = computed(() => {
      const currentPlan = get(plan)
      const date = new Date(currentPlan.startDate * 1000)
      return date.toLocaleDateString()
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
          ...currentRoute.query,
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
.plan {
  @apply font-bold;
}

.change {
  @apply font-bold text-base cursor-pointer p-4;

  color: #351404;
}
</style>
