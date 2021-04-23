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

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-col;
}

$list-font-size: 24px;
$list-line-height: 32px;

.list {
  @apply font-sans font-light text-black;

  font-size: $list-font-size;
  line-height: $list-line-height;

  @include for-size(phone-only) {
    font-size: $list-font-size * $mobile-font-percentage;
    line-height: $list-line-height * $mobile-font-percentage;
  }
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
