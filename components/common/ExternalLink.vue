<template>
  <a :class="$style.link" :href="url" target="_blank">
    {{ display }}
  </a>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ExternalLink',
  props: {
    url: {
      required: true,
      type: String,
    },
    text: {
      required: false,
      type: String,
      default: '',
    },
  },
  computed: {
    display() {
      return this.text ? this.text : this.url
    },
  },
})
</script>

<style module>
.link {
  @apply hover:text-shade8 text-primary;
}
</style>
