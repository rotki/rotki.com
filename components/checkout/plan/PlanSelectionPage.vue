<template>
  <page wide :center-vertically="false">
    <template #title>Select a Plan</template>
    <error-display v-if="error" title="Error" :message="error" />
    <loader v-else-if="plans.length === 0" full />
    <page-content v-else>
      <plan-selection :plans="plans" />
    </page-content>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeMount,
  ref,
} from '@nuxtjs/composition-api'
import { get, set } from '@vueuse/core'
import { PremiumData } from '~/types'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'PlanSelectionPage',
  setup() {
    const { premium } = useMainStore()
    const data = ref<PremiumData | null>(null)
    const error = ref('')
    onBeforeMount(async () => {
      const availablePlans = await premium()
      if (!availablePlans.isError) {
        set(data, availablePlans.result)
      } else {
        set(error, availablePlans.error.message)
      }
    })

    const plans = computed(() => get(data)?.plans ?? [])
    return {
      plans,
      error,
    }
  },
})
</script>
