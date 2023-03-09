<script setup lang="ts">
const { data } = await useAsyncData('/', () =>
  queryContent('/jobs/backend').findOne()
);
</script>

<template>
  <div>
    <ContentRenderer :value="data" />
  </div>
</template>
