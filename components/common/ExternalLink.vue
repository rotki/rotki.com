<template>
  <a
    :class="$style.link"
    :href="url"
    :target="sameTab ? '_self' : '_blank'"
    :rel="noRef ? 'noreferrer' : null"
  >
    {{ display }}
  </a>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
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
    sameTab: {
      required: false,
      type: Boolean,
      default: false,
    },
    noRef: {
      required: false,
      type: Boolean,
      default: false,
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
