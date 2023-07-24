<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <PageContainer :center-vertically="false">
    <template #title> Premium Features </template>
    <PageContent>
      <div class="w-full">
        <div :class="css.title">Premium Features Details</div>
        <div :class="css.details">
          <TextHeading :class="css.subtitle">Data synchronization</TextHeading>
          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Data Synchronization"
                src="/img/products/details/data_sync.jpg"
              />
            </template>
            By being a premium user you have the option to upload your account's
            encrypted database to our server. It can then be synchronized
            between different devices. It also serves as a backup. The data is
            encrypted with your password and we can not read it. Synced
            databases are automatically deleted a month after your subscription
            expires
          </ProductDetailDescription>

          <TextHeading :class="css.subtitle">Analytics</TextHeading>
          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Asset amount value"
                src="/img/products/details/stats_asset_amount_value.jpg"
              />
            </template>
            <template #title>Asset amount & value over time</template>
            As a premium user you can access the analytics section of the
            application and unlock analytics graphs such as analysis of net
            value and amount over time for each asset you own.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Asset distribution"
                src="/img/products/details/stats_distribution_location.jpg"
              />
            </template>
            <template #title>Value distribution</template>
            Or a distribution pie chart of your net value per location
            (exchanges, blockchain accounts, banks e.t.c.)
          </ProductDetailDescription>

          <TextHeading :class="css.subtitle">Dark Mode</TextHeading>
          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Dark Mode"
                src="/img/products/details/dark_mode.jpg"
              />
            </template>
            Dark mode can lessen the strain on your eyes, improve the
            readability of text and prolong the battery life of your device.
          </ProductDetailDescription>

          <TextHeading :class="css.subtitle"
            >Increased event limits</TextHeading
          >
          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="ETH Transactions"
                src="/img/products/details/transactions.jpg"
              />
            </template>
            <template #title>Ethereum transactions</template>
            Free users have a limit of the 100 most recent ethereum transactions
            in the transactions viewer. As a premium user you have higher limits
            in the amount of transactions you can see.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Unlimited Trades"
                src="/img/products/details/trades.jpg"
              />
            </template>
            <template #title>Trades</template>
            Free users have a limit of the 250 most recent trades in the trades
            viewer. As a premium user you have higher limits in the amount of
            trades you can see.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Unlimited Deposits and Withdrawals"
                src="/img/products/details/deposits_and_withdrawals.jpg"
              />
            </template>
            <template #title>Deposit/withdrawals</template>
            Free users have a limit of the 100 most recent exchange
            deposits/withdrawals in the deposits/withdrawals viewer. As a
            premium user there are higher limits in the amount of exchange
            deposits/withdrawals you can see
          </ProductDetailDescription>

          <TextHeading :class="css.subtitle">DeFi</TextHeading>
          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Compound Details"
                src="/img/products/details/sc_compound1.jpg"
              />
            </template>
            <template #title>Compound Finance Historical Analysis</template>
            As a premium user you can see how much you have earned/lost by using
            the Compound Finance protocol. For earning, how much you earned by
            lending and COMP rewards. For losses, how much you lost by borrowing
            or liquidations.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Compound History"
                src="/img/products/details/sc_compound2.jpg"
              />
            </template>
            As a premium user you can also see a history of all your
            interactions with the Compound Finance protocol for all assets.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Vaults Premium"
                src="/img/products/details/sc_vaults_premium.jpg"
              />
            </template>
            <template #title>MakerDAO Vaults</template>
            By having a premium subscription all your MakerDAO vaults are
            auto-detected and you can see all of the information per vault,
            including the interest rate owed in DAI. You can also see all the
            historical vault information about the actions you have taken for
            each one of your vaults.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Vaults Premium Watchers"
                src="/img/products/details/sc_vaults_premium_watchers.jpg"
              />
              <img
                :class="css.image"
                alt="Vaults Premium Watchers Email"
                src="/img/products/details/sc_vaults_premium_watchers_email.jpg"
              />
            </template>
            <template #title>MakerDAO Vault Watchers</template>
            Premium users can also set vault watchers that will reside on
            Rotki's servers. That means they can choose a target
            collateralization ratio and if the vault's ratio goes above or below
            that ratio an email alert is sent to their email address. Users can
            have multiple watchers per vault.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="AAVE Historical Accounting"
                src="/img/products/details/sc_aave.jpg"
              />
            </template>
            <template #title>Aave Historical Analysis</template>
            All Aave historical accounting data for lending/borrowing along with
            how much interest you have earned by lending from the Aave protocol
            can be inspected when you are using a premium account.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Yearn Vaults"
                src="/img/products/details/sc_yearn_vaults1.jpg"
              />
            </template>
            <template #title>
              Yearn Finance Vaults Historical Analysis
            </template>
            As a premium user you can see how much you have earned in each of
            the yearn.finance vaults.
          </ProductDetailDescription>

          <ProductDetailDescription>
            <template #left>
              <img
                :class="css.image"
                alt="Yearn History"
                src="/img/products/details/sc_yearn_vaults2.jpg"
              />
            </template>
            You can also see a history of all your vault actions
            (deposits/withdrawals).
          </ProductDetailDescription>

          <div :class="css.actions">
            <SubscribeNowButton />
          </div>
        </div>
      </div>
    </PageContent>
  </PageContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.title {
  @apply font-bold text-3xl text-rui-text;
}

.details {
  @apply flex flex-col items-center mt-16 w-full;
}

.subtitle {
  @apply pb-4 mb-12 relative;

  &::before {
    content: '';
    @apply absolute w-16 h-1 bg-rui-primary left-1/2 top-full transform -translate-x-1/2;
  }
}

.actions {
  @apply flex justify-center;
}
</style>
