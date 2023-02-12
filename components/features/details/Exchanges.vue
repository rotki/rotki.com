<template>
  <feature id="exchanges">
    <template #title>
      {{ $t('home.exchanges.title') }}
    </template>
    <template #image>
      <img
        :class="$style.image"
        alt="Supported Exchanges"
        src="~/assets/img/exchanges.png"
      />
    </template>
    <feature-details>
      {{ $t('home.exchanges.detail') }}
    </feature-details>
    <div :class="$style.list">
      <item-list :list="column1" />
      <item-list :list="column2" />
    </div>
    <external-link
      :class="$style.link"
      same-tab
      :text="$t('home.more_information')"
      url="/supported"
    />
  </feature>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Exchanges',
  setup() {
    return {
      column1: ['Kraken', 'KuCoin', 'Binance', 'Binance US', 'Bittrex'],
      column2: ['Coinbase', 'Coinbase Pro', 'Gemini', 'and many more...'],
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;
  position: absolute;

  @include for-size(phone-only) {
    max-width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    max-width: 100%;
    top: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-top: 20px;
    max-width: 755px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    right: -250px;
  }
}

.list {
  @apply flex flex-row justify-between;

  padding-right: 120px;

  @include for-size(phone-only) {
    padding-right: 40px;
  }
}

.link {
  @apply mt-6 text-2xl;
}
</style>
