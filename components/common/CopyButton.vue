<script setup lang="ts">
import { set } from '@vueuse/core';

const props = defineProps<{ modelValue: string; disabled?: boolean }>();

const { modelValue } = toRefs(props);
const copied = ref(false);

const { start, stop } = useTimeoutFn(() => set(copied, false), 4000);
const { copy } = useClipboard({ source: modelValue });
const { t } = useI18n({ useScope: 'global' });

function copyToClipboard() {
  stop();
  copy();
  set(copied, true);
  start();
}
</script>

<template>
  <RuiTooltip>
    <template #activator>
      <RuiButton
        :disabled="disabled"
        tabindex="-1"
        variant="text"
        type="button"
        class="!p-2"
        icon
        @click="copyToClipboard()"
      >
        <RuiIcon
          class="text-black/[.54] dark:text-white/[.56]"
          size="20"
          name="lu-copy"
        />
      </RuiButton>
    </template>
    {{ copied ? t('copy_button.copied') : t('copy_button.copy') }}
  </RuiTooltip>
</template>
