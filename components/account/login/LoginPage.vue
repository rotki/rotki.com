<template>
  <page>
    <template #title> Premium account management </template>
    <template #hint>
      <div :class="$style.hint">
        Here you can create or login to your premium account. A premium account
        is only needed to unlock the premium features of the application and is
        not the same as the account you use in the Rotki application.
        Credentials for one account can not be used for the other.
      </div>
    </template>

    <div :class="$style.container">
      <login-form />
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'LoginPage',
})
</script>

<style lang="scss" module>
.hint {
  @apply items-center text-justify mb-16;

  max-width: 500px;
}

.container {
  @apply flex flex-row align-middle justify-center w-full h-full items-center py-16;
}
</style>
