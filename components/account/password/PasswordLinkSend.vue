<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title>Password recovery</template>
    <div :class="css.content">
      <UserActionMessage>
        <template #header>Please check your email</template>
        <p>A recovery link has been send to your account's address.</p>
        <p>Please check your mailbox to proceed.</p>
      </UserActionMessage>
    </div>
  </PageContainer>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-row justify-center;
}
</style>
