<template>
  <page wide>
    <template #title> Select a Payment method </template>
    <payment-method-selection />
  </page>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'

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
  },
})
</script>

<style lang="scss" module>
.methods {
  padding: 0;
}
</style>
