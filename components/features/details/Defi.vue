<template>
  <feature id="defi">
    <template #title> {{ $t('home.defi.title') }} </template>
    <template #image>
      <img
        :class="$style.image"
        alt="DeFi protocols"
        src="~/assets/img/defi.png"
      />
    </template>
    <feature-details>
      {{ $t('home.defi.detail') }}
    </feature-details>
    <div :class="$style['list-container']">
      <item-list :list="defi" />
    </div>
    <external-link
      :class="$style.link"
      same-tab
      :text="$t('home.more_information')"
      url="/supported#defi"
    />
  </feature>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Defi',
  setup() {
    return {
      defi: [
        'MakerDAO',
        'Aave',
        'Compound',
        'Yearn vaults',
        'Uniswap',
        'Balancer',
        'and many more...',
      ],
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;
  @include for-size(phone-only) {
    width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(tablet-landscape-up) {
    max-width: 732px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 38px;
    right: -200px;
  }
}

.link {
  @apply mt-6 text-2xl;
}
</style>
