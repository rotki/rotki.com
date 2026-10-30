<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();

defineSlots<{
  default: () => any;
  description?: () => any;
  actions?: () => any;
  footer?: () => any;
}>();

const headingId = useId();
</script>

<template>
  <section :aria-labelledby="title ? headingId : undefined">
    <header
      v-if="title || $slots.actions"
      class="mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3"
    >
      <div
        v-if="title"
        class="min-w-0 max-w-2xl"
      >
        <h2
          :id="headingId"
          class="text-h6 text-rui-text"
        >
          {{ title }}
        </h2>
        <p
          v-if="description || $slots.description"
          class="mt-1 text-body-2 text-rui-text-secondary text-pretty"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="flex items-center gap-2 shrink-0"
      >
        <slot name="actions" />
      </div>
    </header>

    <slot />

    <footer
      v-if="$slots.footer"
      class="mt-8 pt-5 border-t border-default flex flex-wrap justify-end gap-3"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
