<template>
  <div :class="$style.wrapper">
    <ul :class="$style.list">
      <li v-for="item in list" :key="item" :class="$style.row">{{ item }}</li>
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

  font-size: 24px;
  line-height: 32px;
}

.list .row {
  display: flex;
  flex-direction: row;
}

.list li::before {
  @apply text-primary;

  margin-top: 12px;
  margin-right: 8px;
  content: '•';
  font-size: 38px;
  line-height: 8px;
}
</style>
