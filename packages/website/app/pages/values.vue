<script lang="ts" setup>
import ValueBody from '~/components/values/ValueBody.vue';
import ValueContact from '~/components/values/ValueContact.vue';
import ValueHeading from '~/components/values/ValueHeading.vue';
import ValueVision from '~/components/values/ValueVision.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Our Values',
  'The core values behind rotki — privacy, transparency, open source, and putting users first in crypto portfolio management.',
  '/values',
);

definePageMeta({
  landing: true,
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
