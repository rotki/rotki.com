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
  },
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const { width, height, padding, modelValue } = toRefs(props);
const out = ref(true);
const visible = ref(false);

onMounted(() => set(visible, get(modelValue)));
watch(modelValue, (display) => {
  if (display) {
    set(visible, true);
    set(out, true);
    nextTick(() => {
      set(out, false);
    });
  }
  else {
    set(out, true);
    nextTick(() => {
      setTimeout(() => {
        set(visible, false);
      }, 800);
    });
  }
});

function dismiss() {
  emit('update:modelValue', false);
}

function prevent(e: Event) {
  e.stopPropagation();
}

const style = computed(() => ({
  'max-width': width.value,
  'height': height.value,
  'padding': padding.value,
  'margin': '0.5rem',
}));

const css = useCssModule();
</script>

<template>
  <div
    v-if="visible"
    :class="{ [css.container]: true, [css.out]: out }"
  >
    <div
      :class="css.overlay"
      @click="dismiss()"
    >
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
  @apply w-screen h-screen overflow-y-hidden z-30 fixed top-0 right-0 bg-black/[0.6];
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  &:not(.boxless) {
    @apply bg-white flex flex-col rounded-lg mb-2;
  }

  @apply transition transform translate-y-0;
}

.out .dialog {
  transform: translateY(100vh);
}

.container {
  @apply w-screen h-screen overflow-y-hidden fixed top-0 right-0 z-[101] transition opacity-100;
}

.out.container {
  @apply opacity-0;
}
</style>
