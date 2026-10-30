<script setup lang="ts">
const { title, description } = defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<template>
  <div>
    <h1 class="text-h5 md:text-h4 text-rui-text text-pretty">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="mt-3 text-body-1 text-rui-text-secondary text-pretty"
    >
      {{ description }}
    </p>
  </div>
</template>
