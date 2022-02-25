<template>
  <page wide>
    <template #title> Select a Payment method </template>
    <payment-method-selection :identifier="subscriptionIdentifier" />
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeMount,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'
import { get } from '@vueuse/core'

export default defineComponent({
  name: 'PaymentMethodPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    onBeforeMount(() => {
      if (!('p' in route.value.query)) {
        router.push('/checkout/plan')
      }
    })

    const subscriptionIdentifier = computed(() => {
      const currentRoute = get(route)
      return 'id' in currentRoute.query ? currentRoute.query.id : undefined
    })
    return {
      subscriptionIdentifier,
    }
  },
})
</script>

<style lang="scss" module>
.methods {
  padding: 0;
}
</style>
