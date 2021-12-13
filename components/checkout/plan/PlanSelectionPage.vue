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
  onBeforeMount,
  ref,
} from '@nuxtjs/composition-api'
import { PremiumData } from '~/types'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'PlanSelectionPage',
  setup() {
    const { premium } = useMainStore()
    const data = ref<PremiumData | null>(null)
    onBeforeMount(async () => {
      const availablePlans = await premium()
      if (!availablePlans.isError) {
        data.value = availablePlans.result
      }

      // TODO properly handle errors
    })

    const plans = computed(() => data.value?.plans ?? [])
    return {
      plans,
    }
  },
})
</script>
