<template>
  <div v-bind="$attrs">
    <div :class="$style.content">
      <div :class="$slots.image ? $style.column1 : $style.column">
        <div :class="$style.title">
          <div :class="$style.column">
            <anchor :id="id"></anchor>
            <slot name="title"></slot>
          </div>
        </div>
        <slot></slot>
      </div>
      <div v-if="$slots.image" :class="$style.column2">
        <slot name="image"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Feature',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
})
</script>

<style module>
.content {
  @apply flex flex-row mt-37 flex-wrap-reverse;
}

.title {
  @apply flex flex-row font-serif font-bold text-5.5xl text-shade11;

  font-size: 2.88888rem;
  line-height: 3.72222rem;
  letter-spacing: -0.03em;
  margin-bottom: 3.22222rem;
}

.column {
  @apply flex flex-col;
}

.column1 {
  @apply flex flex-col col-span-12 md:col-span-7;

  max-width: 38.33333rem;
}

.column2 {
  @apply flex flex-col col-span-12 md:col-span-5;
}
</style>
