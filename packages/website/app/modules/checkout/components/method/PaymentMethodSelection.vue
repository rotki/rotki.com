<script lang="ts" setup>
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import CheckoutTitle from '~/modules/checkout/components/common/CheckoutTitle.vue';
import CheckoutMethodTiles from '~/modules/checkout/components/method/CheckoutMethodTiles.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col w-full grow">
    <CheckoutTitle>{{ t('home.plans.tiers.step_2.title') }}</CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_2.subtitle') }}
    </CheckoutDescription>
    <CheckoutMethodTiles class="my-6" />
  </div>
</template>
