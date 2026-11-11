<script setup lang="ts">
const { message } = defineProps<{
  /** Read out to screen readers; the page shows its own layout as placeholders. */
  message: string;
}>();
</script>

<template>
  <div
    aria-busy="true"
    class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-x-12 lg:gap-y-6 lg:items-start"
    data-testid="loading-state"
  >
    <!-- Prerendered into the page, so the first paint already has the payment page's layout. -->
    <p
      role="status"
      class="sr-only"
    >
      {{ message }}
    </p>

    <div
      aria-hidden="true"
      class="h-8 md:h-9 w-72 max-w-full rounded bg-rui-surface-muted animate-pulse lg:col-span-2 lg:row-start-1"
    />

    <div
      aria-hidden="true"
      class="flex flex-col gap-6 lg:col-start-1 lg:row-start-2"
    >
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div
          v-for="tile in 3"
          :key="tile"
          class="h-[4.5rem] rounded-rui-card border border-rui-divider bg-rui-surface"
        />
      </div>
      <!-- Same heights as the card details: the title, the card fields and the note under them. -->
      <div class="flex flex-col gap-4 p-4 md:p-6 rounded-rui-card border border-rui-divider bg-rui-surface animate-pulse">
        <div class="h-7 w-32 rounded bg-rui-surface-muted" />
        <div class="grid grid-cols-2 gap-4 min-h-[8.5rem] content-start">
          <div
            v-for="(span, index) in ['col-span-2', '', '']"
            :key="index"
            :class="span"
          >
            <div class="h-4 w-24 mt-0.5 mb-1.5 rounded bg-rui-surface-muted" />
            <div class="h-9 rounded-rui-control bg-rui-surface-muted" />
          </div>
        </div>
        <div class="h-10 rounded bg-rui-surface-muted" />
      </div>
    </div>

    <div
      aria-hidden="true"
      class="order-first -mx-4 -mt-6 md:-mt-12 h-[4.5rem] border-b border-rui-divider bg-rui-surface lg:order-none lg:m-0 lg:h-80 lg:col-start-2 lg:row-start-2 lg:border lg:rounded-rui-card"
    />

    <!-- Phones only: the pay bar with the consent and the pay button closes the page. -->
    <div
      aria-hidden="true"
      class="lg:hidden -mx-4 h-28 border-t border-rui-divider bg-rui-surface"
    />

    <!-- Phones only: the shell's back link, which appears once the page has loaded. -->
    <div
      aria-hidden="true"
      class="md:hidden h-11"
    />
  </div>
</template>
