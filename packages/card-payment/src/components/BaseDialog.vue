<script setup lang="ts">
import { computed } from 'vue';

const open = defineModel<boolean>('open', { required: true });

const { title, maxWidth = 'md' } = defineProps<{
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}>();

const maxWidthClass = computed<string>(() => {
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  return widths[maxWidth];
});

function handleBackdropClick(): void {
  open.value = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="handleBackdropClick()"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="open"
            class="bg-white rounded-lg p-6 w-full mx-4"
            :class="maxWidthClass"
          >
            <h3
              v-if="title"
              class="text-lg font-medium text-rui-text mb-4"
            >
              {{ title }}
            </h3>
            <div class="mb-6">
              <slot />
            </div>
            <div
              v-if="$slots.actions"
              class="flex justify-end gap-4"
            >
              <slot name="actions" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
