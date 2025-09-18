<script setup lang="ts">
import { computed } from 'vue';

const year = computed(() => new Date().getFullYear().toString());
const copyright = computed(() => `© Rotki Solutions GmbH 2018-${year.value}.`);
</script>

<template>
  <div class="border-t border-rui-grey-100">
    <div class="container mx-auto px-4">
      <div class="flex flex-col-reverse lg:flex-row justify-between items-start md:items-center pt-8 pb-12">
        <!-- Copyright on the left -->
        <div class="flex flex-wrap space-x-1 text-rui-text-secondary mt-6 lg:mt-0">
          <div>{{ copyright }}</div>
          <div>All rights reserved</div>
        </div>
        <div />
      </div>
    </div>
  </div>
</template>
