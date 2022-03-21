<template>
  <feature id="dashboard">
    <template #title>{{ $t('home.dashboard.title') }}</template>
    <template #image>
      <img
        :class="$style.image"
        alt="Rotki Dashboard"
        src="~/assets/img/dashboard.png"
      />
    </template>
    <feature-details>
      <template #subtitle>
        {{ $t('home.dashboard.details.asset_and_liabilities.title') }}
      </template>
      {{ $t('home.dashboard.details.asset_and_liabilities.description') }}
    </feature-details>
    <feature-details>
      <template #subtitle>
        {{ $t('home.dashboard.details.net_worth_over_time.title') }}
      </template>
      {{ $t('home.dashboard.details.net_worth_over_time.description') }}
    </feature-details>
    <div class="flex flex-row">
      <download-button @click="$emit('download')" />
    </div>
  </feature>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Dashboard',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  @media only screen and (min-width: 1190px) {
    right: -750px !important;
  }

  @media only screen and (min-width: 1280px) {
    right: -680px;
  }

  @media only screen and (min-width: 1500px) {
    right: -400px;
  }

  @include for-size(phone-only) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(desktop-up) {
    top: 80px;
    position: absolute;
  }

  @include for-size(big-desktop-up) {
    right: -400px;
  }
}
</style>
