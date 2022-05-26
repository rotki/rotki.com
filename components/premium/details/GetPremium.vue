<template>
  <div :class="$style.container">
    <action-button
      filled
      :text="$tc('actions.get_premium')"
      @click="navigateTo"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, useRouter } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'GetPremium',
  setup() {
    const router = useRouter()
    const navigateTo = () => {
      router.push('/products')
    }
    return {
      navigateTo,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.container {
  @apply flex flex-col align-middle self-center;

  margin-top: 105px;

  @include for-size(phone-only) {
    margin-left: auto;
    margin-right: auto;
  }

  @include for-size(tablet-landscape-up) {
    width: 42%;
  }
}
</style>
