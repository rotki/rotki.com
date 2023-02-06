<template>
  <PageContainer>
    <template #title> Almost Done </template>
    <div :class="css.content">
      <UserActionMessage>
        <template #header>Thank you for registering.</template>
        <p>
          To use your new rotki account you have to first confirm your e-mail.
        </p>
        <p>
          Please check your mailbox and follow the instructions to activate your
          account.
        </p>
      </UserActionMessage>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style lang="scss" module>
.content {
  @apply flex flex-row justify-center;
}
</style>
