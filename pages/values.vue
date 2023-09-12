<script lang="ts" setup>
import { commonAttrs } from '~/utils/metadata';

useHead({
  title: 'values',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Values of rotki',
    },
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <div>
    <ValueHeading />
    <ValueBody />
    <ValueVision />
    <div>
      <div class="container">
        <div class="border-t border-rui-grey-200" />
      </div>
    </div>
    <ValueContact />
  </div>
</template>
