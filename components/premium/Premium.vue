<template>
  <div id="premium" :class="$style.premium">
    <div :class="$style.image">
      <img alt="rotki og" :class="$style.top" src="~/assets/img/rotki-og.svg" />
    </div>
    <div :class="$style.wrapper">
      <div>
        <div :class="$style.title">Premium Features</div>
      </div>
      <div :class="$style.main">
        <div :class="$style.content">
          <GraphsStatistics />
          <Transactions />
          <PremiumDefi />
          <Uniswap />
          <PremiumEth2Staking />
          <GetPremium />
        </div>
      </div>
    </div>
    <div :class="$style.image">
      <img
        alt="rotki og"
        :class="$style.bottom"
        src="~/assets/img/rotki-og.svg"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Premium',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.premium {
  padding-top: 350px;
  padding-bottom: 70px;
  width: 100%;
  overflow-x: hidden;

  @include for-size(phone-only) {
    padding-top: 200px;
    overflow-y: hidden;
  }
}

.wrapper {
  @apply bg-primary2 bg-repeat;

  padding-bottom: 100px;

  @include for-size(phone-only) {
    padding-bottom: 400px;
  }
}

.main {
  @apply container mx-auto;
}

.title {
  @apply text-primary font-serif font-bold;

  padding-top: 91px;
  margin-bottom: 10px;
  align-items: center;
  text-align: center;
  letter-spacing: -0.03em;

  @include text-size(66px, 76px);
}

.content {
  @apply flex-wrap flex-row flex justify-between;

  > * {
    @include for-size(tablet-landscape-up) {
      width: 50%;
    }
  }
}

.image {
  position: relative;
  width: 100%;
}

.top {
  position: absolute;
  top: -317px;
  left: -40px;
  width: 358px;
  height: 347px;

  @include for-size(phone-only) {
    position: relative;
    top: 31px;
  }
  @media only screen and (min-width: 2200px) {
    left: 300px;
  }
}

.bottom {
  position: absolute;
  right: -212px;
  transform: matrix(-1, 0, 0, 1, 0, 0);

  @include for-size(phone-only) {
    bottom: -55px;
  }

  @include for-size(tablet-portrait-up) {
    bottom: -63px;
  }
}
</style>
