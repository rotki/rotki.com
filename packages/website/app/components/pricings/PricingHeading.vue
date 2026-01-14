<script setup lang="ts">
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import CheckoutTitle from '~/modules/checkout/components/common/CheckoutTitle.vue';

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
