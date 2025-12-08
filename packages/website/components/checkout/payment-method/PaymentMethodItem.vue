<script lang="ts" setup>
defineProps<{ selected: boolean }>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <div
    class="flex gap-4 justify-center items-center cursor-pointer p-4 min-w-[16rem] xl:min-w-[20rem] 2xl:min-w-[26rem] w-full border border-solid rounded-lg"
    :class="selected ? 'border-rui-primary bg-rui-primary/10' : 'bg-white hover:bg-rui-primary/[0.01] border-black/[0.12]'"
    @click="emit('click')"
  >
    <div class="size-10">
      <slot />
    </div>
    <div class="font-bold grow">
      <slot name="label" />
    </div>
    <RuiRadio
      :model-value="selected ? 'checked' : undefined"
      color="primary"
      hide-details
      value="checked"
    />
  </div>
</template>
