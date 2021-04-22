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
  @apply flex flex-row flex-wrap-reverse;

  margin-top: 191px;
  margin-left: 151px;
  margin-right: 151px;
  @media only screen and (max-width: 767px) {
    margin-left: 80px;
    margin-right: 80px;
  }
}

.title {
  @apply flex flex-row font-serif font-bold text-shade11;

  font-size: 52px;
  line-height: 67px;
  letter-spacing: -0.03em;
  margin-bottom: 27px;
}

.column {
  @apply flex flex-col;
}

.column1 {
  @apply flex flex-col col-span-12 md:col-span-7;

  max-width: 660px;
}

.column2 {
  @apply flex flex-col col-span-12 md:col-span-5;
}
</style>
