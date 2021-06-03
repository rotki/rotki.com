<template>
  <div :class="$style.container">
    <action-button filled text="Get Premium" @click="navigateTo" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'GetPremium',
  methods: {
    navigateTo() {
      window.location.href = '/products'
    },
  },
})
</script>

<style module lang="scss">
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
