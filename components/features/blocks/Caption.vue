<template>
  <div :class="$style.caption">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Caption',
})
</script>

<style module>
.caption {
  @apply flex flex-row mt-16 text-shade7 font-sans font-normal;

  font-size: 18px;
  line-height: 32px;
}
</style>
