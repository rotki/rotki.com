<script lang="ts" setup>
import type { ContextColorsType } from '@rotki/ui-library';
import { get, isDefined } from '@vueuse/core';

const { visible, closeable = false, timeout, type = 'error' } = defineProps<{
  visible: boolean;
  closeable?: boolean;
  timeout?: number;
  type?: ContextColorsType;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

defineSlots<{
  title: () => void;
  default: () => void;
}>();

const { stop, start, isPending } = useTimeoutFn(
  () => emit('dismiss'),
  () => timeout ?? 0,
);

function dismiss(): void {
  emit('dismiss');
  if (get(isPending)) {
    stop();
  }
}

watch(() => visible, (show) => {
  if (!(isDefined(timeout) && show)) {
    return;
  }
  if (get(isPending)) {
    stop();
  }
  start();
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="fixed top-0 md:top-28 z-20 w-full md:bottom-auto right-0 md:right-2 md:w-[520px]"
    >
      <RuiAlert
        :closeable="closeable"
        :type="type"
        @close="dismiss()"
      >
        <template
          v-if="$slots.title"
          #title
        >
          <slot name="title" />
        </template>
        <slot />
      </RuiAlert>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[400ms];
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
