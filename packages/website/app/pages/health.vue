<script lang="ts" setup>
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Health');

const message = 'OK';
</script>

<template>
  <div> {{ message }} </div>
</template>
