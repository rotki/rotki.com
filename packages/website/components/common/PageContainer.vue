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
  <div class="container flex flex-col min-h-full flex-grow py-12">
    <div
      class="flex-row flex flex-grow h-full"
      :class="{
        'items-center': centerVertically,
        'justify-center': centerHorizontally,
      }"
    >
      <div
        class="w-full 2xl:max-w-5xl xl:max-w-3xl max-sm:w-[90%]"
        :class="wide ? 'max-w-[85%] max-sm:max-w-[90%]' : undefined"
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
      class="items-center text-justify w-full bottom-10 text-rui-text-secondary text-sm sm:p-2 sm:bottom-2 *:mx-auto *:max-w-lg"
    >
      <slot name="hint" />
    </div>
  </div>
</template>
