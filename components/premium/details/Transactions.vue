<template>
  <premium-feature>
    <template #title>
      Unlimited trades, transactions, deposits and withdrawals
    </template>
    Free users have a limit on the number of transactions, deposits, withdrawals
    and other events they can see and process. Premium users have no such limit.
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Transactions',
})
</script>
