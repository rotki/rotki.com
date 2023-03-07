<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Premium account management </template>
    <template #hint>
      <div :class="css.hint">
        Here you can create or login to your premium account. A premium account
        is only needed to unlock the premium features of the application and is
        not the same as the account you use in the Rotki application.
        Credentials for one account can not be used for the other.
      </div>
    </template>

    <div :class="css.container">
      <LoginForm />
    </div>
  </PageContainer>
</template>

<style lang="scss" module>
.hint {
  @apply items-center text-justify mb-16;

  max-width: 500px;
}

.container {
  @apply flex flex-row align-middle justify-center w-full h-full items-center py-16;
}
</style>
