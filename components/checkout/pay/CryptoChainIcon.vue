<script setup lang="ts">
defineProps<{
  chain: string;
}>();

const pending = ref(true);
const error = ref(false);
</script>

<template>
  <div class="w-6 h-6">
    <div
      v-if="pending || error"
      class="w-full h-full bg-rui-grey-300 text-rui-grey-700 uppercase rounded-md flex items-center justify-center"
    >
      {{ chain[0] }}
    </div>
    <img
      class="w-full h-full"
      :class="{ hidden: pending || error }"
      :src="`/img/chains/${chain}.svg`"
      @loadstart="pending = true"
      @load="pending = false"
      @error="
        error = true;
        pending = false;
      "
    />
  </div>
</template>
