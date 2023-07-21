<script setup lang="ts">
import { RuiButton } from '@rotki/ui-library';
const emit = defineEmits<{ (e: 'click'): void }>();

const { t } = useI18n();
</script>

<template>
  <div>
    <RuiButton
      variant="default"
      size="lg"
      class="!py-4 !px-10 !text-xl uppercase"
      rounded
      color="primary"
      @click="emit('click')"
    >
      {{ t('actions.download') }}
    </RuiButton>
  </div>
</template>
