<template>
  <div :class="$style.plan">
    <div :class="$style.title">
      <slot name="title"></slot>
    </div>
    <div :class="$style.description">
      <slot></slot>
      <div :class="$style.button">
        <action-button :text="action" @click="buttonClicked" />
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
    url: {
      type: String,
      required: false,
      default: undefined,
    },
  },
  methods: {
    buttonClicked() {
      if (this.url) {
        window.location.href = this.url
      } else {
        this.$emit('click')
      }
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.plan {
  @apply flex flex-col col-span-12 md:col-span-4 flex-shrink;

  margin-top: 93px;
}

.title {
  @apply font-bold text-primary2 font-serif text-center;

  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
}

.description {
  @apply font-sans text-center text-primary2 flex flex-col self-center;

  margin-top: 45px;
  max-width: 370px;
  height: 100%;

  @include text-size(24px, 32px);
}

.button {
  margin-top: 75px;
}
</style>
