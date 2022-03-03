<template>
  <page wide :center-vertically="false">
    <template #title>Select a Plan</template>
    <loader v-if="!plans" full />
    <page-content v-else>
      <plan-selection :plans="plans" />
    </page-content>
  </page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@nuxtjs/composition-api'
import { toRefs } from '@vueuse/core'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'PlanSelectionPage',
  setup() {
    const store = useMainStore()
    const { plans } = toRefs(store)
    onMounted(async () => await store.getPlans())
    return {
      plans,
    }
  },
})
</script>
