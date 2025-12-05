<script setup lang="ts">
defineProps<{
  iconUrl?: string;
  name: string;
}>();

const pending = ref(false);
const error = ref(false);
</script>

<template>
  <div class="w-6 h-6">
    <div
      v-if="pending || error || !iconUrl"
      class="w-full h-full bg-rui-grey-300 text-rui-grey-700 uppercase rounded-md flex items-center justify-center"
    >
      {{ name[0] }}
    </div>
    <NuxtImg
      v-if="iconUrl"
      class="w-full h-full"
      :class="{ hidden: pending || error }"
      :src="iconUrl"
      width="24"
      height="24"
      @loadstart="pending = true"
      @load="pending = false"
      @error="
        error = true;
        pending = false;
      "
    />
  </div>
</template>
