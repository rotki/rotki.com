<template>
  <feature id="profitloss-report">
    <template #title> {{ $t('home.profit_loss_report.title') }}</template>
    <template #image>
      <img
        :class="$style.image"
        alt="Cryptocurrencies"
        src="~/assets/img/crypto.svg"
      />
    </template>
    <feature-details>
      <i18n path="home.profit_loss_report.detail">
        <br />
      </i18n>
    </feature-details>
  </feature>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ProfitLossReport',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;

  @include for-size(phone-only) {
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portait-up) {
    position: relative;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 40px;
    right: -80px;
  }
}
</style>
