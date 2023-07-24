<script setup lang="ts">
const css = useCssModule();
const slots = useSlots();
</script>

<template>
  <address :class="css.address">
    <ContentSlot :use="slots.default" unwrap="p" />
  </address>
</template>

<style lang="scss" module>
.address {
  @apply text-rui-grey-800 mt-6 font-normal not-italic whitespace-pre;
}
</style>
