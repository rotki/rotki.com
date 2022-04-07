<template>
  <page>
    <template #title> Account Delete </template>
    <page-content>
      <user-action-message>
        <template #header>Your account was deleted</template>
        <p>Your rotki premium account has been successfully deleted.</p>
      </user-action-message>
    </page-content>
  </page>
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'AccountDeletedPage',
})
</script>
