<template>
  <div :class="$style.wrapper">
    <ul :class="$style.list">
      <li v-for="item in list" :key="item" :class="$style.row">{{ item }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ItemList',
  props: {
    list: {
      type: Array,
      required: true,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-col;
}

.list {
  @apply font-sans font-light text-black;

  @include text-size(24px, 32px);
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

  @include for-size(phone-only) {
    margin-top: 8px;
  }
}
</style>
