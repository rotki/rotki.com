<template>
  <div>
    <div :class="$style.image">
      <img :class="$style.top" src="~/assets/img/rotki-og.svg" />
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
      <img :class="$style.bottom" src="~/assets/img/rotki-og.svg" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Premium',
})
</script>

<style module>
.wrapper {
  @apply bg-primary2 bg-repeat;

  padding-bottom: 100px;
  @media only screen and (max-width: 855px) {
    padding-bottom: 400px;
  }
}

.main {
  @apply container;

  margin-left: 151px;
  margin-right: 151px;
}

.title {
  @apply text-primary font-serif font-bold;

  padding-top: 91px;
  margin-bottom: 10px;
  font-size: 66px;
  line-height: 76px;
  align-items: center;
  text-align: center;
  letter-spacing: -0.03em;
}

.content {
  @apply flex-wrap flex-row flex justify-between;
}

.image {
  position: relative;
}

.top {
  position: absolute;
  top: -317px;
  left: -40px;
  width: 358px;
  height: 347px;

  @media only screen and (max-width: 855px) {
    position: relative;
    top: 31px;
  }
  @media only screen and (min-width: 2200px) {
    left: 300px;
  }
}

.bottom {
  position: absolute;
  bottom: -63px;
  right: -212px;
  transform: matrix(-1, 0, 0, 1, 0, 0);
  width: 431px;
  height: 418px;
  @media only screen and (min-width: 2200px) {
    right: 300px;
  }
}
</style>
