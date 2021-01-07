<template>
  <button class="h-16 font-serif text-xl uppercase">{{ text }}</button>
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
  },
})
</script>
