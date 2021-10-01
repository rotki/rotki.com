<template>
  <page wide>
    <template #title> Account Management </template>
    <subscriptions />
    <payments />
    <api-keys v-if="premium" />
  </page>
</template>

<script lang="ts">
import { computed, defineComponent, useStore } from '@nuxtjs/composition-api'
import { RootState } from '~/store'

export default defineComponent({
  name: 'Overview',
  setup() {
    const store = useStore<RootState>()
    const premium = computed(() => {
      return store.state.account?.can_use_premium ?? false
    })
    return {
      premium,
    }
  },
})
</script>
