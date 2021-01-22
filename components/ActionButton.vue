<template>
  <button
    class="btn"
    :class="{
      'btn--primary': primary,
      'btn--secondary': !primary,
      'btn--filled': filled,
    }"
    @click="$emit('click')"
  >
    {{ text }}
  </button>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    text: {
      type: String,
      required: true,
    },
    primary: {
      type: Boolean,
      required: false,
      default: false,
    },
    filled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
})
</script>
