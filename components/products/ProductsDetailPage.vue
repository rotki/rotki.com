<template>
  <page :center-vertically="false">
    <page-content>
      <div class="w-full">
        <div :class="$style.title">Premium Features Details</div>
        <div :class="$style.details">
          <heading :class="$style.subtitle">Data synchronization</heading>
          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Data Synchronization"
                src="~/assets/img/products/details/data_sync.jpg"
              />
            </template>
            By being a premium user you have the option to upload your account's
            encrypted database to our server. It can then be synchronized
            between different devices. It also serves as a backup. The data is
            encrypted with your password and we can not read it.
          </product-detail-description>

          <heading :class="$style.subtitle">Analytics</heading>
          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Asset amount value"
                src="~/assets/img/products/details/stats_asset_amount_value.jpg"
              />
            </template>
            <template #title>Asset amount & value over time</template>
            As a premium user you can access the analytics section of the
            application and unlock analytics graphs such as analysis of net
            value and amount over time for each asset you own.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Asset distribution"
                src="~/assets/img/products/details/stats_distribution_location.jpg"
              />
            </template>
            <template #title>Value distribution</template>
            Or a distribution pie chart of your net value per location
            (exchanges, blockchain accounts, banks e.t.c.)
          </product-detail-description>

          <heading :class="$style.subtitle">Dark Mode</heading>
          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Dark Mode"
                src="~/assets/img/products/details/dark_mode.jpg"
              />
            </template>
            Dark mode can lessen the strain on your eyes, improve the
            readability of text and prolong the battery life of your device.
          </product-detail-description>

          <heading :class="$style.subtitle">Unlimited Histories</heading>
          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Unlimited ETH Transactions"
                src="~/assets/img/products/details/unlimited_transactions.jpg"
              />
            </template>
            <template #title>Unlimited Ethereum transactions</template>
            Free users have a limit of the 250 most recent ethereum transactions
            in the transactions viewer. As a premium user there is no limit in
            the amount of transactions you can see.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Unlimited Trades"
                src="~/assets/img/products/details/unlimited_trades.jpg"
              />
            </template>
            <template #title>Unlimited trades</template>
            Free users have a limit of the 250 most recent trades in the trades
            viewer. As a premium user there is no limit in the amount of trades
            you can see.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Unlimited Deposits and Withdrawals"
                src="~/assets/img/products/details/unlimited_deposits_and_withdrawals.jpg"
              />
            </template>
            <template #title>Unlimited deposit/withdrawals</template>
            Free users have a limit of the 100 most recent exchange
            deposits/withdrawals in the deposits/withdrawals viewer. As a
            premium user there is no limit in the amount of exchange
            deposits/withdrawals you can see
          </product-detail-description>

          <heading :class="$style.subtitle">DeFi</heading>
          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Compound Detail"
                src="~/assets/img/products/details/sc_compound1.jpg"
              />
            </template>
            <template #title>Compound Finance Historical Accounting</template>
            As a premium user you can see how much you have earned/lost by using
            the Compound Finance protocol. For earning, how much you earned by
            lending and COMP rewards. For losses, how much you lost by borrowing
            or liquidations.</product-detail-description
          >

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Compound History"
                src="~/assets/img/products/details/sc_compound2.jpg"
              />
            </template>
            As a premium user you can also see a history of all your
            interactions with the Compound Finance protocol for all assets. All
            interactions are also included in the tax report.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Vaults Premium"
                src="~/assets/img/products/details/sc_vaults_premium.jpg"
              />
            </template>
            <template #title>MakerDAO Vaults</template>
            By having a premium subscription all your MakerDAO vaults are
            auto-detected and you can see all of the information per vault,
            including the interest rate owed in DAI. You can also see all the
            historical vault information about the actions you have taken for
            each one of your vaults. Finally by using premium, MakerDAO vault
            actions are taken into account in the tax report.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Vaults Premium Watchers"
                src="~/assets/img/products/details/sc_vaults_premium_watchers.jpg"
              />
              <img
                :class="$style.image"
                alt="Vaults Premium Watchers Email"
                src="~/assets/img/products/details/sc_vaults_premium_watchers_email.jpg"
              />
            </template>
            <template #title>MakerDAO Vault Watchers</template>
            Premium users can also set vault watchers that will reside on
            Rotki's servers. That means they can choose a target
            collateralization ratio and if the vault's ratio goes above or below
            that ratio an email alert is sent to their email address. Users can
            have multiple watchers per vault.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="AAVE Historical Accounting"
                src="~/assets/img/products/details/sc_aave.jpg"
              />
            </template>
            <template #title>Aave Historical Accounting</template>
            All Aave historical accounting data for lending/borrowing along with
            how much interest you have earned by lending from the Aave protocol
            can be inspected when you are using a premium account.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Yearn Vaults"
                src="~/assets/img/products/details/sc_yearn_vaults1.jpg"
              />
            </template>
            <template #title
              >Yearn Finance Vaults Historical Accounting</template
            >
            As a premium user you can see how much you have earned in each of
            the yearn.finance vaults.
          </product-detail-description>

          <product-detail-description>
            <template #left>
              <img
                :class="$style.image"
                alt="Yearn Histories"
                src="~/assets/img/products/details/sc_yearn_vaults2.jpg"
              />
            </template>
            You can also see a history of all your vault actions
            (deposits/withdrawals) and have them included in the tax report.
          </product-detail-description>

          <div :class="$style.actions">
            <action-button primary @click="goToCheckoutPlan()">
              Subscribe now
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
  name: 'ProductsDetailPage',
  setup() {
    const router = useRouter()
    const goToCheckoutPlan = () => router.push('/checkout/plan')
    return {
      goToCheckoutPlan,
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

.subtitle {
  @apply pb-4 mb-12 relative;

  &::before {
    content: '';
    @apply absolute w-16 h-1 bg-primary left-1/2 top-full transform -translate-x-1/2;
  }
}

.actions {
  @apply flex justify-center;
}
</style>
