<template>
  <div :class="$style.wrapper">
    <div :class="$style.row">
      <div :class="$style.logo">
        <img src="~/assets/img/logo-small.svg" />
      </div>
      <div :class="$style.links">
        <links />
        <footer-icon-links />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageFooter',
})
</script>

<style module>
.wrapper {
  @apply container mx-auto;

  padding-bottom: 3.3333rem;
}

.row {
  @apply flex flex-row items-end;
}

.links {
  @apply flex flex-row justify-between;

  width: 100%;
}

.logo {
  margin-right: 3.3333rem;
}
</style>
