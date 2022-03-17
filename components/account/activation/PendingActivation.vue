<template>
  <page>
    <template #title> Almost Done </template>
    <div :class="$style.content">
      <user-action-message>
        <template #header>Thank you for registering.</template>
        <p>
          To use your new rotki account you have to first confirm your e-mail.
        </p>
        <p>
          Please check your mailbox and follow the instructions to activate your
          account.
        </p>
      </user-action-message>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PendingActivation',
})
</script>

<style lang="scss" module>
.content {
  @apply flex flex-row justify-center;
}
</style>
