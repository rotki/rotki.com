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
        <span v-if="plan.vat">
          {{
            $t('selected_plan_overview.vat', {
              vat: plan.vat,
              priceInEur: plan.priceInEur,
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
import { getPlanName } from '~/utils/plans'

export default defineComponent({
  name: 'SelectedPlanOverview',
  props: {
    plan: {
      required: true,
      type: Object as PropType<SelectedPlan>,
    },
    crypto: {
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
.plan {
  @apply font-bold;
}

.change {
  @apply font-bold;

  line-height: 19px;
  font-size: 16px;
  letter-spacing: 0;
  color: #351404;
}
</style>
