<template>
  <fragment>
    <anchor id="features" />
    <middle-menu />
    <div :class="$style.wrapper">
      <div>
        <dashboard @download="$emit('download')" />
        <exchanges />
        <defi />
        <defi-details />
        <profit-loss-report :class="$style.last" />
      </div>
    </div>
  </fragment>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Features',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container;
}

.last {
  @include for-size(phone-only) {
    margin-left: 0;
  }

  @include for-size(tablet-portrait-up) {
    margin-left: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-left: 280px !important;
    margin-bottom: -150px;
  }

  @include for-size(desktop-up) {
    margin-left: 280px;
    margin-bottom: -150px;
  }
}
</style>
