<script lang="ts" setup>
import { commonAttrs, getMetadata } from '~/utils/metadata';

useHead({
  title: 'values',
  meta: getMetadata('rotki', 'Values of rotki', '/values'),
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
