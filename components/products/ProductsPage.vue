<template>
  <page :center-vertically="false">
    <template #title>Premium</template>
    <page-content>
      <div class="w-full">
        <div :class="$style.title">Premium Features</div>
        <div :class="$style.details">
          <product-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Staking"
                src="~/assets/img/products/staking.svg"
              />
            </template>
            <template #title>Staking</template>
            See information about your staking activity for multiple chains and
            locations (ETH, LQTY, Kraken and more). Information like total
            gained in a period and individual staking deposit/withdrawal/income
            events.
          </product-description>
          <product-description>
            <template #right>
              <img alt="Higher limits" src="~/assets/img/products/crypto.svg" />
            </template>
            <template #title>Higher Limits</template>
            rotki has limits for multiple things that the free version can
            process. Number of trades, number of transactions,
            deposits/withdrawals, historic events and more. With premium these
            limits are increasing depending on the tier you have bought.
          </product-description>
          <product-description>
            <template #left>
              <img alt="Customizations" src="~/assets/img/products/dark.svg" />
            </template>
            <template #title>Dark mode and more perks</template>
            Premium gives you access to various perks such as dark mode and
            customizable color layout in the app. Some other perks include
            watchers for your makerdao CDP position that can warn you when by
            email when it goes over or below a certain collateralization ratio.
          </product-description>
          <product-description>
            <template #right>
              <img alt="Graphs" src="~/assets/img/products/trades.svg" />
            </template>
            <template #title>Graphs</template>
            Rotki premium gives you access to an array of analytics in the form
            of graphs. You can see, among others, the analysis of total net
            value over time, amount and value per asset over time, distribution
            of your total worth per asset or per location.
          </product-description>
          <product-description>
            <template #left>
              <img
                alt="Encrypted Synchronization"
                src="~/assets/img/products/sync.svg"
              />
            </template>
            <template #title>Synchronization</template>
            You have the option to upload your account's encrypted database to
            our server. It can then be synchronized between different devices.
            It also serves as a backup. The data is encrypted with your password
            and we can not read it.
          </product-description>
          <product-description>
            <template #right>
              <img
                alt="DeFi protocols"
                src="~/assets/img/products/eth@2x.png"
              />
            </template>
            <template #title>Information per DeFi protocol</template>
            You can see extra information per supported DeFi protocols. For
            example analysis of your liquity, aave, compound, makerdao
            positions. Analysis of your yearn vaults. Breakdown of the swaps
            made in uniswap, sushiswap, balancer and more.
          </product-description>
          <div :class="$style.actions">
            <action-button primary @click="goToCheckoutPlan()">
              Subscribe now
            </action-button>
            <action-button @click="goToProductsDetail">
              More Details
            </action-button>
          </div>
        </div>
      </div>
    </page-content>
  </page>
</template>

<script lang="ts">
import { defineComponent, useRouter } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ProductsPage',
  setup() {
    const router = useRouter()
    const goToCheckoutPlan = () => router.push('/checkout/plan')
    const goToProductsDetail = () => router.push('/products/detail')
    return {
      goToCheckoutPlan,
      goToProductsDetail,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.title {
  @apply font-serif font-bold text-3xl text-typography;
}

.details {
  @apply flex flex-col items-center mt-16 w-full;
}

.actions {
  @apply flex flex-row justify-center flex-wrap;

  > * {
    margin-right: $mobile-margin;
    margin-left: $mobile-margin;

    @include for-size(phone-only) {
      margin-top: $mobile-margin;
      margin-bottom: $mobile-margin;
    }
  }

  @include for-size(phone-only) {
    @apply flex-wrap;
  }
}
</style>
