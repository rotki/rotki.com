<template>
  <div :class="$style.wrapper">
    <div :class="$style.content">
      <div :class="$style.title">
        <slot name="title"></slot>
      </div>
      <div :class="$style.description">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PremiumFeature',
})
</script>

<style module>
.wrapper {
  @apply flex flex-col;

  width: 40%;
  margin-top: 160px;
  @media only screen and (max-width: 756px) {
    width: 100%;
  }
}

.content {
  max-width: 500px;
}

.title {
  @apply font-bold font-serif text-white;

  margin-bottom: 38px;
  font-size: 32px;
  line-height: 47px;
  letter-spacing: -0.01em;
}

.description {
  @apply font-sans font-light text-white;

  font-size: 24px;
  line-height: 30px;
}
</style>
