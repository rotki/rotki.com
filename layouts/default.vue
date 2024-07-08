<script setup lang="ts">
import { get } from '@vueuse/core';

const css = useCssModule();

const headerRef = ref<HTMLDivElement>();
const footerRef = ref<HTMLDivElement>();

const { height: topHeight } = useElementBounding(headerRef);
const { height: bottomHeight } = useElementBounding(footerRef);

const otherHeight = computed<number>(
  () => get(topHeight) + get(bottomHeight) || 219,
);

provide('otherHeight', otherHeight);
</script>

<template>
  <div ref="headerRef">
    <PageHeader />
  </div>
  <div :class="css.body">
    <slot />
  </div>
  <div ref="footerRef">
    <slot name="footer">
      <PageFooter />
    </slot>
  </div>
</template>

<style lang="scss" module>
.body {
  min-height: calc(100vh - v-bind(otherHeight) * 1px);
  @apply flex flex-col;
}
</style>
