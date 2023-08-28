<script lang="ts" setup>
import { get } from '@vueuse/core';
import { type ContextColorsType } from '@rotki/ui-library/dist/consts/colors';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    closeable?: boolean;
    timeout?: number;
    type?: ContextColorsType;
  }>(),
  {
    closeable: false,
    type: 'error',
    timeout: undefined,
  },
);

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

const slots = useSlots();

const { timeout, visible } = toRefs(props);

const { stop, start, isPending } = useTimeoutFn(
  () => emit('dismiss'),
  () => get(timeout) ?? 0,
);

const dismiss = () => {
  emit('dismiss');
  get(isPending) && stop();
};

watch(visible, (show) => {
  if (isDefined(get(timeout)) && show) {
    get(isPending) && stop();
    start();
  }
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="fixed top-0 md:top-28 z-20 w-full md:bottom-auto right-0 md:right-2 md:w-[520px]"
    >
      <RuiAlert :closeable="closeable" :type="type" @close="dismiss()">
        <template v-if="slots.title" #title>
          <slot name="title" />
        </template>
        <slot />
      </RuiAlert>
    </div>
  </Transition>
</template>
