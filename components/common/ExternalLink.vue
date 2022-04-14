<template>
  <a
    :class="$style.link"
    :href="url"
    :target="sameTab ? '_self' : '_blank'"
    :rel="noRef ? 'noreferrer' : null"
  >
    <slot>
      {{ display }}
    </slot>
  </a>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from '@nuxtjs/composition-api'

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
  setup(props) {
    const { text, url } = toRefs(props)
    const display = computed(() => (text.value ? text.value : url.value))
    return {
      display,
    }
  },
})
</script>

<style module>
.link {
  @apply hover:text-shade8 text-primary;
}
</style>
