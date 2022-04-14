<template>
  <card>
    <div :class="$style.row">
      <div :class="$style.logo">
        <img alt="rotki" src="~/assets/img/logo-small.svg" />
      </div>
      <div>
        <heading subheading> Rotki Premium </heading>
        <div :class="$style.premium">
          No premium subscription found. Select your
          <nuxt-link :class="$style.link" to="/checkout/plan">
            premium subscription plan.
          </nuxt-link>
        </div>
      </div>
    </div>
  </card>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PremiumPlaceholder',
})
</script>
<style lang="scss" module>
@import '~assets/css/media';

.row {
  @apply flex flex-row items-center;
}

.premium {
  @apply mt-2;
}

.logo {
  margin: 16px 60px 16px 16px;
}

.link {
  @apply hover:text-shade8 text-primary;
}
</style>
