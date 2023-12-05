<script lang="ts" setup>
import 'swiper/css';
import { get } from '@vueuse/core';
import type { Swiper } from 'swiper/types';

const props = withDefaults(
  defineProps<{
    activeIndex: number;
    pages: number;
    swiper?: Swiper;
    arrowButtons?: boolean;
  }>(),
  {
    swiper: undefined,
    arrowButtons: false,
  },
);

const emit = defineEmits<{ (e: 'update:swiper', value: Swiper): void }>();

const { swiper } = toRefs(props);

const css = useCssModule();

const onNavigate = (index: number) => {
  const s = get(swiper);

  if (!s) {
    return;
  }

  s.slideTo(index - 1);
  emit('update:swiper', s);
};
</script>

<template>
  <RuiFooterStepper
    :class="css.controls"
    :model-value="activeIndex"
    :pages="pages"
    :arrow-buttons="arrowButtons"
    variant="bullet"
    @update:model-value="onNavigate($event)"
  />
</template>

<style lang="scss" module>
.controls {
  width: 100%;
}
</style>
