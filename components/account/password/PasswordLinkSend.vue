<template>
  <page>
    <template #title>Password recovery</template>
    <div :class="$style.content">
      <user-action-message>
        <template #header>Please check your email</template>
        <p>A recovery link has been send to your account's address.</p>
        <p>Please check your mailbox to proceed.</p>
      </user-action-message>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PasswordLinkSend',
  setup() {},
})
</script>

<style lang="scss" module>
.content {
  @apply flex flex-row justify-center;
}
</style>
