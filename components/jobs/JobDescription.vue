<script setup lang="ts">
defineProps<{
  job: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}>();
</script>

<template>
  <div
    class="p-4 rounded border border-rui-grey-300 space-y-4 hover:bg-rui-grey-100"
  >
    <div class="text-body-1">
      {{ job.title }}
    </div>
    <div class="text-body-2 text-rui-text-secondary">
      {{ job.description }}
    </div>
    <div
      v-if="job.tags && job.tags.length > 0"
      class="space-x-2.5"
    >
      <JobTag
        v-for="tag in job.tags"
        :key="tag"
        :tag="tag"
      />
    </div>
  </div>
</template>
