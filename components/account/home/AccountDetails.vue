<template>
  <div>
    <change-password />
    <account-information />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import ChangePassword from '~/components/account/home/ChangePassword.vue'
import AccountInformation from '~/components/account/home/AccountInformation.vue'

export default defineComponent({
  name: 'AccountDetails',
  components: { AccountInformation, ChangePassword },
})
</script>
