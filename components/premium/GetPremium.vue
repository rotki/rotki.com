<template>
  <div :class="$style.container">
    <action-button filled text="Get Premium" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'GetPremium',
})
</script>

<style module>
.container {
  @apply flex flex-col col-span-6 flex-shrink align-middle self-center;

  margin-top: 4.75rem;
  width: 100%;
  max-width: 31rem;
}
</style>
