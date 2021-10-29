<template>
  <page wide>
    <template #title>Select a Plan</template>
    <plan-selection :plans="plans" />
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  useAsync,
  useStore,
} from '@nuxtjs/composition-api'
import { PremiumData } from '~/types'
import { Actions } from '~/store'

export default defineComponent({
  name: 'PlanSelectionPage',
  setup() {
    const { dispatch } = useStore()
    const premium = useAsync<PremiumData>(() => dispatch(Actions.PREMIUM))
    const plans = computed(() => premium.value?.plans ?? [])
    return {
      plans,
    }
  },
})
</script>
