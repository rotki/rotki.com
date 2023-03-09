<script setup lang="ts">
withDefaults(
  defineProps<{
    small?: boolean;
  }>(),
  {
    small: false,
  }
);

const css = useCssModule();
</script>

<template>
  <p
    :class="[
      css.text,
      {
        [css.small]: small,
      },
    ]"
  >
    <slot />
  </p>
</template>

<style lang="scss" module>
.text {
  @apply font-sans text-shade11 text-justify mt-4;
  @apply text-[0.7875rem] sm:text-[0.9rem] md:text-[1.0125rem] 2xl:text-[1.2375rem];
  @apply leading-[1.1375rem] sm:leading-[1.3rem] md:leading-[1.4625rem] 2xl:leading-[1.7875rem];
}

.small {
  @apply text-[0.6125rem] sm:text-[0.7rem] md:text-[0.7875rem] 2xl:text-[0.9625rem];
  @apply leading-[0.875rem] sm:leading-4 md:leading-[1.125rem] 2xl:leading-[1.375rem];
}
</style>
