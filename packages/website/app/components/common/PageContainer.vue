<script setup lang="ts">
withDefaults(defineProps<{
  wide?: boolean;
  centerVertically?: boolean;
  centerHorizontally?: boolean;
}>(), {
  wide: false,
  centerHorizontally: true,
  centerVertically: true,
});
</script>

<template>
  <div
    :class="$style.wrapper"
    class="container"
  >
    <div
      :class="{
        [$style.content]: true,
        [$style['center-vertically']]: centerVertically,
        [$style['center-horizontally']]: centerHorizontally,
      }"
    >
      <div
        :class="{
          [$style.details]: true,
          [$style.wideBody]: wide,
        }"
      >
        <h4
          v-if="$slots.title"
          class="text-h4 text-rui-text text-center mb-4"
        >
          <slot name="title" />
        </h4>
        <slot />
      </div>
    </div>

    <div
      v-if="$slots.hint"
      :class="$style.hint"
    >
      <slot name="hint" />
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/assets/css/media' as media;
@use '@/assets/css/main';

.wrapper {
  @apply flex flex-col min-h-full flex-grow py-12;
}

.subtitle {
  @apply text-rui-text font-medium text-center uppercase text-base;
}

.content.center-vertically {
  @apply items-center;
}

.content.center-horizontally {
  @apply justify-center;
}

.content {
  @apply flex-row flex flex-grow h-full;
}

.details.wideBody {
  max-width: 85%;

  @include media.for-size(phone-only) {
    max-width: 90%;
  }
}

.details {
  @apply w-full 2xl:max-w-5xl xl:max-w-3xl;

  @include media.for-size(phone-only) {
    width: 90%;
  }
}

.hint {
  @apply items-center text-justify w-full bottom-10 text-rui-text-secondary text-sm sm:p-2 sm:bottom-2;

  div {
    @apply ml-auto mr-auto max-w-lg;
  }
}
</style>
