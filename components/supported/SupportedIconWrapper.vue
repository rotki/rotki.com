<template>
  <div :class="css.wrapper">
    <img :src="img" :class="css.img" />
    <div :class="css.name">{{ name }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  img: string
  name: string
}>()

const css = useCssModule()
</script>

<style lang="scss" module>
.wrapper {
  @apply py-4 px-2 md:px-4 shadow flex items-center rounded-lg;
}

.img {
  @apply w-6 h-6 md:w-10 md:h-10;
}

.name {
  @apply ml-2 md:ml-4 font-bold;
}
</style>
