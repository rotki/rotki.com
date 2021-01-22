<template>
  <div :class="$style.row">
    <div :class="$style.column">
      <a href="#features" :class="$style.link"> Features </a>
    </div>
    <div :class="$style.column">
      <a
        href="https://rotki.readthedocs.io/en/latest/index.html"
        target="_blank"
        :class="$style.link"
      >
        Documentation
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://blog.rotki.com/" target="_blank" :class="$style.link">
        Blog
      </a>
    </div>
    <div :class="$style.column">
      <a href="mailto:info@rotki.com" target="_blank" :class="$style.link">
        Contact
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style module>
.row {
  @apply flex flex-row justify-around;

  max-width: 25.1666rem;
}

.column {
  @apply flex flex-col font-sans uppercase justify-center text-primary2;

  margin-left: 0.8888rem;
  margin-right: 0.8888rem;
}

.link {
  @apply hover:text-shade8;
}
</style>
