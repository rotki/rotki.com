<template>
  <button
    :class="{
      [$style.button]: true,
      [$style.primary]: primary,
      [$style.secondary]: !primary,
      [$style.filled]: filled,
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

<style module>
.button {
  @apply font-serif uppercase rounded-full border-2 focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

  font-size: 1rem;
  line-height: 1.27777rem;
  height: 3.61111rem;
  padding-left: 3rem;
  padding-right: 3rem;
}

.primary {
  @apply text-white bg-primary hover:bg-shade12;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}
</style>
