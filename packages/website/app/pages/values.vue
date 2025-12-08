<script lang="ts" setup>
import ValueBody from '~/components/values/ValueBody.vue';
import ValueContact from '~/components/values/ValueContact.vue';
import ValueHeading from '~/components/values/ValueHeading.vue';
import ValueVision from '~/components/values/ValueVision.vue';
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
