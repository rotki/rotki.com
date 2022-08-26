<template>
  <div :class="$style.wrapper">
    <supported-icon-wrapper
      v-for="item in items"
      :key="item.name"
      :name="item.name"
      :img="item.img"
    />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SupportedRowWrapper',
  props: {
    items: {
      required: true,
      type: Array as PropType<{ name: string; img: string }[]>,
    },
  },
})
</script>
<style lang="scss" module>
.wrapper {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8;
}
</style>
