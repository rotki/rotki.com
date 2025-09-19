<script setup lang="ts">
interface Props {
  error: string;
}

defineProps<Props>();

const emit = defineEmits<{
  back: [];
}>();

const { t } = useI18n({ useScope: 'global' });

function handleBack() {
  emit('back');
}
</script>

<template>
  <div class="text-center py-12">
    <!-- Error icon -->
    <div class="mb-6">
      <RuiIcon
        name="lu-circle-alert"
        size="64"
        color="error"
        class="mx-auto"
      />
    </div>

    <!-- Error title -->
    <h2 class="text-2xl font-semibold mb-4 text-rui-error">
      {{ t('subscription.3d_secure.error_title') }}
    </h2>

    <!-- Error message -->
    <div class="mb-6 max-w-md mx-auto">
      <RuiAlert
        type="error"
        class="text-left"
      >
        {{ error }}
      </RuiAlert>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-4 justify-center mt-9 w-full max-w-[27.5rem] mx-auto">
      <RuiButton
        class="w-full"
        size="lg"
        @click="handleBack()"
      >
        {{ t('actions.back') }}
      </RuiButton>
    </div>

    <!-- Help text -->
    <div class="mt-8 text-sm text-rui-text-secondary">
      <p>{{ t('subscription.3d_secure.error_help') }}</p>
    </div>
  </div>
</template>
