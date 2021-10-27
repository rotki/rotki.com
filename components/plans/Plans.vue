<template>
  <div :class="$style.wrapper">
    <div>
      <div :class="$style.header">Start using Rotki today!</div>
    </div>
    <div :class="$style.basic">
      <div :class="$style.content">
        <free-plan @download="$emit('download')" />
        <basic-plan />
        <advanced-plan v-if="false" />
      </div>
    </div>
    <custom-plan v-if="false" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Plans',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  margin-top: 123px;
  padding-bottom: 200px; // 30px with custom plan;
}

.header {
  @apply font-bold font-serif text-primary2;

  text-align: center;
  letter-spacing: -0.03em;
  padding-right: $mobile-margin;
  padding-left: $mobile-margin;

  @include text-size(84px, 108px);
}

.basic {
  @apply container mx-auto;
}

.content {
  @apply flex-wrap flex-row flex lg:justify-around justify-center;
}
</style>
