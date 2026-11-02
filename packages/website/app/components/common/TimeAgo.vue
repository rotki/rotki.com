<script setup lang="ts">
import { formatDate } from '~/utils/date';

/** "5 minutes ago" that keeps itself current, with the exact time on hover. */
const { date } = defineProps<{
  date: string;
}>();

const relative = useTimeAgo(() => date);
</script>

<template>
  <span
    class="whitespace-nowrap"
    :title="formatDate(date, 'MMM DD, YYYY, HH:mm')"
  >
    {{ relative }}
  </span>
</template>
