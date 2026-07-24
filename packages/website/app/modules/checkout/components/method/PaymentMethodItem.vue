<script lang="ts" setup>
const { disabled = false, disabledLabel, selected } = defineProps<{
  disabled?: boolean;
  disabledLabel?: string;
  selected: boolean;
}>();

const emit = defineEmits<{ click: [] }>();

defineSlots<{
  default: () => void;
  label: () => void;
}>();

function handleClick(): void {
  if (!disabled)
    emit('click');
}
</script>

<template>
  <div
    :aria-disabled="disabled"
    class="flex gap-4 justify-center items-center p-4 min-w-[16rem] xl:min-w-[20rem] 2xl:min-w-[26rem] w-full border border-solid rounded-lg"
    :class="[
      selected ? 'border-rui-primary bg-rui-primary/10' : 'bg-white border-black/[0.12]',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-rui-primary/[0.01]',
    ]"
    @click="handleClick()"
  >
    <div class="size-10">
      <slot />
    </div>
    <div class="grow">
      <div class="font-bold">
        <slot name="label" />
      </div>
      <div
        v-if="disabled && disabledLabel"
        class="text-sm font-normal text-rui-text-secondary"
      >
        {{ disabledLabel }}
      </div>
    </div>
    <RuiRadio
      :disabled="disabled"
      :model-value="selected ? 'checked' : undefined"
      color="primary"
      hide-details
      value="checked"
    />
  </div>
</template>
