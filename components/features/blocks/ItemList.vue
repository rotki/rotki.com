<template>
  <div :class="$style.wrapper">
    <ul :class="$style.list">
      <li v-for="item in list" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ItemList',
  props: {
    list: {
      type: Array,
      required: true,
    },
  },
})
</script>

<style module>
.wrapper {
  @apply flex flex-col col-span-6;
}

.list {
  @apply font-sans font-light text-black;

  font-size: 1.5rem;
  line-height: 2rem;
}

.list li::before {
  @apply text-primary;

  content: '•';
  font-size: 2.5rem;
  line-height: 2rem;
}
</style>
