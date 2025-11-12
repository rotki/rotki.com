<script setup lang="ts">
interface Props {
  icon: string;
  label: string;
  value?: string;
  subtitle?: string;
  valueClass?: string;
}

defineProps<Props>();

const slots = defineSlots<{
  default?: () => any;
}>();
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-rui-text-secondary text-sm mb-1">
      <RuiIcon
        :name="icon"
        size="16"
      />
      <span>{{ label }}</span>
    </div>
    <div
      v-if="slots.default"
      class="text-body-1"
      :class="valueClass"
    >
      <slot />
    </div>
    <div
      v-else
      class="text-body-1"
      :class="valueClass"
    >
      {{ value }}
    </div>
    <div
      v-if="subtitle"
      class="text-sm text-rui-text-secondary"
    >
      {{ subtitle }}
    </div>
  </div>
</template>
