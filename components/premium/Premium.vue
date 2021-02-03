<template>
  <div>
    <div :class="$style['icon-wrapper']">
      <img :class="$style.top" src="~/assets/img/rotki-og.svg" />
    </div>
    <div :class="$style.wrapper">
      <div :class="$style.main">
        <div>
          <div :class="$style.title">Premium Features</div>
        </div>
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
    <div :class="$style['icon-wrapper']">
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

  padding-bottom: 4.5rem;
}

.main {
  @apply container mx-auto;
}

.title {
  @apply text-primary font-serif font-bold;

  padding-top: 5.688rem;
  margin-bottom: 3.188rem;
  font-size: 3.66666rem;
  line-height: 4.22222rem;
  align-items: center;
  text-align: center;
  letter-spacing: -0.03em;
}

.content {
  @apply flex-wrap flex-row flex justify-evenly;
}

.icon-wrapper {
  position: relative;
}

.top {
  position: absolute;
  top: -17.6rem;
  left: -3rem;
  width: 358px;
  height: 347px;
  @media only screen and (max-width: 855px) {
    position: relative;
    top: 1.7rem;
  }
  @media only screen and (min-width: 2200px) {
    left: 10rem;
  }
  @media only screen and (min-width: 3000px) {
    left: 35rem;
  }
}

.bottom {
  position: absolute;
  bottom: -3.5rem;
  right: -10.5rem;
  transform: matrix(-1, 0, 0, 1, 0, 0);
  width: 23.94444rem;
  height: 23.22222rem;
  @media only screen and (min-width: 2200px) {
    right: 10rem;
  }
  @media only screen and (min-width: 3000px) {
    right: 35rem;
  }
  @media only screen and (max-width: 855px) {
    position: relative;
  }
}
</style>
