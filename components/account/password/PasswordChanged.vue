<template>
  <page>
    <template #title>Password Change</template>
    <user-action-message>
      <template #header>Password changed.</template>
      <div>
        Your password has been changed.
        <external-link same-tab text="account" url="/home" />.
      </div>
    </user-action-message>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PasswordChanged',
  setup() {},
})
</script>
