<template>
  <div :class="$style.wrapper" v-bind="$attrs">
    <div :class="$style.content">
      <div :class="$style.column1">
        <div :class="$style.title">
          <div :class="$style.column">
            <slot name="title"></slot>
          </div>
        </div>
        <slot></slot>
      </div>
      <div :class="$style.column2">
        <slot name="image"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style module>
.wrapper {
  top: 0;
}

.content {
  @apply flex flex-row mt-37;
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
  margin-left: 3.8rem;
}

.column2 {
  @apply flex flex-col col-span-full md:col-span-5;
}
</style>
