<script setup lang="ts">
defineProps<{ statusCode: number; title: string }>();

const emit = defineEmits<{ 'handle-error': [] }>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <h1 :class="$style.title">
    {{ statusCode }}
  </h1>
  <p :class="$style.subtitle">
    {{ title }}
  </p>

  <div class="flex justify-center">
    <RuiButton
      variant="default"
      size="lg"
      filled
      color="primary"
      @click="emit('handle-error')"
    >
      {{ t('actions.go_back_home') }}
    </RuiButton>
  </div>
</template>

<style module lang="scss">
.title {
  @apply block text-red-500 font-bold text-6xl;
}

.subtitle {
  @apply block font-light text-rui-text my-8 text-3xl;
}
</style>
