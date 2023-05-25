<script setup lang="ts">
import { get, set } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    width?: string;
    height?: string;
    padding?: string;
    boxless?: boolean;
  }>(),
  {
    width: '800px',
    padding: '0px',
    boxless: false,
    height: undefined,
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const { width, height, padding, modelValue } = toRefs(props);
const out = ref(false);
const visible = ref(false);

onMounted(() => set(visible, get(modelValue)));
watch(modelValue, (display) => {
  if (display) {
    out.value = false;
    visible.value = true;
  } else {
    out.value = true;
    nextTick(() => {
      setTimeout(() => {
        visible.value = false;
      }, 800);
    });
  }
});
const dismiss = () => {
  emit('update:modelValue', false);
};

const prevent = (e: Event) => {
  e.stopPropagation();
};

const style = computed(() => ({
  'max-width': width.value,
  height: height.value,
  padding: padding.value,
  margin: '0.5rem',
}));

const css = useCssModule();
</script>

<template>
  <div v-if="visible" :class="{ [css.container]: true, [css.out]: out }">
    <div :class="css.overlay" @click="dismiss()">
      <div :class="css.wrapper">
        <div
          :class="{
            [css.dialog]: true,
            [css.boxless]: boxless,
          }"
          :style="style"
          @click="prevent($event)"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.overlay {
  @apply w-screen h-screen overflow-y-hidden z-30 fixed top-0 right-0;

  background-color: #0000002e;
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  &:not(.boxless) {
    @apply bg-white flex flex-col rounded-lg mb-2;
  }

  transform: scale(0);
  animation: zoomIn 0.5s 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.out .dialog {
  animation: zoomOut 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.container {
  @apply w-screen h-screen overflow-y-hidden fixed top-0 right-0;

  z-index: 101;
  transform: scaleY(0.01) scaleX(0);
  animation: unfoldIn 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.out.container {
  transform: scale(1);
  animation: unfoldOut 1s 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

@keyframes unfoldIn {
  0% {
    transform: scaleY(0.005) scaleX(0);
  }
  50% {
    transform: scaleY(0.005) scaleX(1);
  }
  100% {
    transform: scaleY(1) scaleX(1);
  }
}

@keyframes unfoldOut {
  0% {
    transform: scaleY(1) scaleX(1);
  }
  50% {
    transform: scaleY(0.005) scaleX(1);
  }
  100% {
    transform: scaleY(0.005) scaleX(0);
  }
}

@keyframes zoomIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes zoomOut {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
</style>
