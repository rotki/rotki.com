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

  margin-top: 93px;
}

.title {
  @apply font-bold text-primary2 font-serif text-center;

  letter-spacing: -0.01em;
  font-size: 32px;
  line-height: 47px;
}

.body {
  @apply font-sans text-center text-primary2 flex flex-col self-center;

  font-size: 24px;
  line-height: 32px;
  margin-top: 45px;
  max-width: 370px;
}

.button {
  margin-top: 75px;
}
</style>
