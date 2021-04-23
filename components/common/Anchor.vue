<template>
  <span
    :class="{
      [$style.anchor]: true,
      [$style.sticky]: sticky,
    }"
    v-bind="$attrs"
  />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Anchor',
  props: {
    sticky: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
})
</script>

<style module>
.anchor {
  display: inline-block;
  content: ' ';
  margin-left: -500px;
  width: 285px;
  visibility: hidden;
  pointer-events: none;
}

.sticky {
  padding-top: 64px;
}
</style>
