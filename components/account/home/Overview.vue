<template>
  <page wide>
    <template #title> Account Management </template>
    <subscriptions :class="$style.category" />
    <payments :class="$style.category" />
    <api-keys v-if="premium" :class="$style.category" />
    <account-details :class="$style.category" />
    <danger-zone :class="$style.category" />
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
      return store.state.account?.canUsePremium ?? false
    })
    return {
      premium,
    }
  },
})
</script>

<style lang="scss" module>
.category {
  @apply mt-8;
}
</style>
