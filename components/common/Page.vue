<template>
  <div :class="$style.wrapper">
    <Header no-margin>
      <template #subtitle>
        <div :class="$style.subtitle">
          <slot name="title" />
        </div>
      </template>
    </Header>

    <div :class="$style.content">
      <div :class="$style.details">
        <slot />
      </div>
    </div>

    <page-footer />
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'Page',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container mx-auto flex flex-col flex-grow justify-between;

  min-height: 100vh;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  text-align: center;
  text-transform: uppercase;

  @include text-size(16px, 20px);
}

.content {
  @apply flex-row flex items-center justify-center;

  padding-top: 56px;
  padding-bottom: 48px;
}

.details {
  max-width: 800px;

  @include for-size(phone-only) {
    width: 96%;
  }
}
</style>
