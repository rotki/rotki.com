<template>
  <div :class="css.wrapper">
    <HeaderArea no-margin>
      <template #subtitle>
        <div :class="css.subtitle">
          <slot name="title" />
        </div>
      </template>
      <slot name="links" />
    </HeaderArea>

    <div
      :class="{
        [css.content]: true,
        [css['center-vertically']]: centerVertically,
        [css['center-horizontally']]: centerHorizontally,
      }"
    >
      <div
        :class="{
          [css.details]: true,
          [css.wideBody]: wide,
        }"
      >
        <slot />
      </div>
    </div>

    <div v-if="slots.hint" :class="css.hint">
      <slot name="hint"></slot>
    </div>

    <PageFooter />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    wide?: boolean
    centerVertically?: boolean
    centerHorizontally?: boolean
  }>(),
  {
    wide: false,
    centerHorizontally: true,
    centerVertically: true,
  }
)

const css = useCssModule()
const slots = useSlots()
</script>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply container flex flex-col flex-grow min-h-screen px-4;
}

.subtitle {
  @apply font-sans text-primary2 font-medium text-center uppercase text-base;
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

  @include for-size(phone-only) {
    max-width: 90%;
  }
}

.details {
  @apply w-full 2xl:max-w-5xl xl:max-w-3xl;

  @include for-size(phone-only) {
    width: 90%;
  }
}

.hint {
  @apply items-center text-justify w-full bottom-10 text-shade8 text-sm sm:p-2 sm:bottom-2;

  div {
    @apply ml-auto mr-auto max-w-lg;
  }
}
</style>
