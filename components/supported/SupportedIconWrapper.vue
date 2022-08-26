<template>
  <div :class="$style.wrapper">
    <img :src="img" :class="$style.img" />
    <div :class="$style.name">{{ name }}</div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
export default defineComponent({
  name: 'SupportedIconWrapper',
  props: {
    img: {
      required: true,
      type: String,
    },
    name: {
      required: true,
      type: String,
    },
  },
})
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
