<script setup lang="ts">
defineProps<{
  loading?: boolean;
  showRetry?: boolean;
}>();

defineEmits<{
  back: [];
  retry: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col gap-4 justify-center w-full mt-auto pt-8">
    <!-- Primary action area -->
    <div
      v-if="showRetry"
      class="flex justify-center"
    >
      <RuiButton
        color="primary"
        size="lg"
        :loading="loading"
        :disabled="loading"
        @click="$emit('retry')"
      >
        <template #prepend>
          <RuiIcon
            name="lu-refresh-cw"
            size="16"
          />
        </template>
        {{ t('actions.try_again') }}
      </RuiButton>
    </div>

    <!-- Secondary actions -->
    <div class="flex gap-4 justify-center w-full">
      <RuiButton
        class="w-1/2"
        size="lg"
        variant="outlined"
        :disabled="loading"
        @click="$emit('back')"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
    </div>
  </div>
</template>
