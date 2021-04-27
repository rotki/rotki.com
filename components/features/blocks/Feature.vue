<template>
  <div v-bind="$attrs">
    <div :class="$style.content">
      <div :class="$slots.image ? $style.column1 : $style.column">
        <div :class="$style.title">
          <div :class="$style.column">
            <anchor :id="id" :sticky="sticky" />
            <slot name="title" />
          </div>
        </div>
        <slot></slot>
      </div>
      <div v-if="$slots.image" :class="$style.column2">
        <slot name="image" />
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
    sticky: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.content {
  @apply flex flex-row flex-wrap-reverse;

  margin-top: 191px;
  @include margins();

  @include for-size(phone-only) {
    @apply justify-center;
  }
}

.title {
  @apply flex flex-row font-serif font-bold text-shade11;

  letter-spacing: -0.03em;
  margin-bottom: 27px;

  @include text-size(52px, 67px);
}

.column {
  @apply flex flex-col;
}

.column1 {
  @apply flex flex-col;

  max-width: 660px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.column2 {
  @apply flex flex-col;
}
</style>
