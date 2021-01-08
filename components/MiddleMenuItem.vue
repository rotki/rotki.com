<template>
  <div :class="active ? activeClass : null"><slot></slot></div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    active: {
      type: Boolean,
      required: false,
      default: false,
    },
    activeClass: {
      type: String,
      required: false,
      default: '',
    },
  },
})
</script>
