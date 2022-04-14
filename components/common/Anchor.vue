<template>
  <span :class="$style.anchor" v-bind="$attrs" />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
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
  padding-top: 100px;
}
</style>
