<script setup lang="ts">
import CheckoutDescription from '~/components/checkout/common/CheckoutDescription.vue';
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="mb-6">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_1.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_1.description') }}
    </CheckoutDescription>
  </div>
</template>
