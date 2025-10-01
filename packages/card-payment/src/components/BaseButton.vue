<script setup lang="ts">
import { get } from '@vueuse/core';
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const {
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
} = defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const buttonClasses = computed<string>(() => {
  const baseClasses = 'relative flex items-center justify-center gap-2 font-medium outline-1 outline-offset-[-1px] outline-transparent rounded border-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    'primary': 'bg-rui-primary text-white enabled:hover:bg-rui-primary-darker',
    'secondary': 'bg-rui-grey-200 text-rui-text enabled:hover:bg-rui-grey-100',
    'ghost': 'bg-white text-rui-primary enabled:hover:bg-rui-primary/10',
    'danger': 'bg-red-600 text-white enabled:hover:bg-red-700',
    'danger-ghost': 'text-red-600 enabled:hover:bg-red-50',
  };

  const sizeClasses = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base leading-[1.625rem] px-6 py-2',
    lg: 'text-lg px-8 py-3',
    icon: 'w-10 h-10 p-0',
  };

  return `${baseClasses} ${variantClasses[get(variant)]} ${sizeClasses[get(size)]}`;
});

function handleClick(): void {
  if (!get(disabled) && !get(loading)) {
    emit('click');
  }
}
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick()"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <slot />
  </button>
</template>
