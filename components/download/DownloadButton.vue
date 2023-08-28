<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <NuxtLink class="inline-flex" to="/download">
    <RuiButton
      variant="default"
      size="lg"
      class="!py-4 !px-10 !text-xl uppercase"
      rounded
      color="primary"
    >
      {{ t('actions.start_now_for_free') }}
    </RuiButton>
  </NuxtLink>
</template>
