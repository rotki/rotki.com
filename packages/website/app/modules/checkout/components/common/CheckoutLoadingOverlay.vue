<script setup lang="ts">
const { loading = false } = defineProps<{
  loading?: boolean;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="loading"
        class="fixed inset-0 bg-rui-veil flex items-center justify-center z-rui-blocking"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
    </Transition>
  </Teleport>
</template>
