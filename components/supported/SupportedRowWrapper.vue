<template>
  <div :class="css.wrapper">
    <SupportedIconWrapper
      v-for="item in items"
      :key="item.name"
      :name="item.name"
      :img="item.img"
    />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  items: { name: string; img: string }[]
}>()
const css = useCssModule()
</script>
<style lang="scss" module>
.wrapper {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8;
}
</style>
