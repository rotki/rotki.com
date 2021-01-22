<template>
  <div :class="$style.plan">
    <div :class="$style.title">
      <slot name="title"></slot>
    </div>
    <div :class="$style.body">
      <slot></slot>
      <div :class="$style.button">
        <action-button :text="action"></action-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Plan',
  props: {
    action: {
      type: String,
      required: true,
    },
  },
})
</script>

<style module>
.plan {
  @apply flex flex-col col-span-12 md:col-span-4 flex-shrink;

  margin-top: 4.25rem;
}

.title {
  @apply font-bold text-primary2 font-serif text-center;

  letter-spacing: -0.01em;
  font-size: 2em;
  line-height: 2.9375rem;
}

.body {
  @apply font-sans text-center text-primary2 flex flex-col self-center;

  font-size: 1.5rem;
  line-height: 2rem;
  margin-top: 2.8125rem;
  max-width: 23rem;
}

.button {
  margin-top: 4.6875rem;
}
</style>
