<script setup lang="ts">
import { get } from '@vueuse/core';
import PageFooter from '~/components/footer/PageFooter.vue';
import PageHeader from '~/components/header/PageHeader.vue';

const headerRef = ref<HTMLDivElement>();
const footerRef = ref<HTMLDivElement>();

const { height: topHeight } = useElementBounding(headerRef);
const { height: bottomHeight } = useElementBounding(footerRef);

const otherHeight = computed<number>(
  () => get(topHeight) + get(bottomHeight) || 219,
);

const bodyStyle = computed<{ minHeight: string }>(() => ({
  minHeight: `calc(100vh - ${get(otherHeight)}px)`,
}));

provide('otherHeight', otherHeight);
</script>

<template>
  <div ref="headerRef">
    <PageHeader />
  </div>
  <div
    class="flex flex-col"
    :style="bodyStyle"
  >
    <slot />
  </div>
  <div ref="footerRef">
    <slot name="footer">
      <PageFooter />
    </slot>
  </div>
</template>
