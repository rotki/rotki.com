<script setup lang="ts">
defineProps<{
  iconUrl?: string;
  name: string;
}>();

const pending = ref(true);
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
    <img
      v-if="iconUrl"
      class="w-full h-full"
      :class="{ hidden: pending || error }"
      :src="iconUrl"
      @loadstart="pending = true"
      @load="pending = false"
      @error="
        error = true;
        pending = false;
      "
    />
  </div>
</template>
