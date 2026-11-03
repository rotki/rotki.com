<script setup lang="ts">
/**
 * The row a saved card sits in, shared by the card and its loading placeholder so both keep the
 * same box sizes and line heights. The border color comes from the caller, which knows the state.
 */
defineSlots<{
  /** Before the logo, such as the radio of a card picker. */
  leading?: () => any;
  /** Fills the 56×36 logo box. */
  logo: () => any;
  title: () => any;
  subtitle: () => any;
  /** After the text, such as the auto-renewal chip. */
  badge?: () => any;
  actions?: () => any;
}>();
</script>

<template>
  <div class="rounded-lg border p-4 md:px-5 flex flex-wrap items-center gap-x-4 gap-y-3">
    <slot name="leading" />

    <div class="shrink-0 h-9 w-14 rounded-md overflow-hidden">
      <slot name="logo" />
    </div>

    <div class="flex-1 min-w-40">
      <div class="min-h-6 flex items-center text-body-1 font-medium text-rui-text">
        <slot name="title" />
      </div>
      <div class="min-h-5 flex items-center text-body-2 text-rui-text-secondary">
        <slot name="subtitle" />
      </div>
    </div>

    <slot name="badge" />

    <div
      v-if="$slots.actions"
      class="flex items-center gap-1"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
