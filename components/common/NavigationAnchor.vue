<template>
  <span :class="css.anchor" v-bind="attrs" />
</template>

<script setup lang="ts">
const css = useCssModule()
const attrs = useAttrs()
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
