<template>
  <div :class="$style.wrapper">
    <div>
      <div :class="$style.header">Start using Rotki today!</div>
    </div>
    <div :class="$style.basic">
      <div :class="$style.content">
        <free-plan />
        <basic-plan />
        <advanced-plan />
      </div>
    </div>
    <custom-plan />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Plans',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  margin-top: 123px;
  padding-bottom: 30px;
}

.header {
  @apply font-bold font-serif text-primary2;

  text-align: center;
  letter-spacing: -0.03em;

  @include text-size(84px, 108px);
}

.basic {
  @apply container mx-auto;
}

.content {
  @apply flex-wrap flex-row flex lg:justify-around justify-center;
}
</style>
