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
  @apply flex flex-col align-middle self-center;

  margin-top: 105px;
  width: 40%;
}
</style>
