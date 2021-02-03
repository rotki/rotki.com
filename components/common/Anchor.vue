<template>
  <span :class="$style.anchor" v-bind="$attrs" />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Anchor',
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
</style>
