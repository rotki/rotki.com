<template>
  <div class="premium">
    <div class="container mx-auto">
      <div>
        <div class="premium-header">Premium Features</div>
      </div>
      <div class="premium__features">
        <GraphsStatistics />
        <Transactions />
        <Defi />
        <Uniswap />
        <Eth2Staking />
        <GetPremium />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import GraphsStatistics from '~/components/premium/GraphsStatistics.vue'
import Transactions from '~/components/premium/Transactions.vue'
import Defi from '~/components/premium/Defi.vue'
import Uniswap from '~/components/premium/Uniswap.vue'
import Eth2Staking from '~/components/premium/Eth2Staking.vue'

export default Vue.extend({
  name: 'Premium',
  components: { Defi, Transactions, GraphsStatistics, Uniswap, Eth2Staking },
})
</script>

<style scoped>
.premium {
  @apply bg-primary2 bg-repeat;

  padding-bottom: 4.25rem;
}

.premium-header {
  @apply text-primary font-serif font-bold;

  padding-top: 5.688rem;
  margin-bottom: 3.188rem;
  font-size: 4.125rem;
  line-height: 4.75rem;
  align-items: center;
  text-align: center;
  letter-spacing: -0.03em;
}

.premium__features {
  @apply flex-wrap flex-row flex justify-evenly;
}
</style>
