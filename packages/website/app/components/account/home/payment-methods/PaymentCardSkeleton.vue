<script setup lang="ts">
import PaymentCardLayout from '~/components/account/home/payment-methods/PaymentCardLayout.vue';
</script>

<template>
  <PaymentCardLayout class="border-default">
    <!-- Same layout as PaymentCard, so the list does not move when the cards arrive -->
    <template #logo>
      <RuiSkeletonLoader
        class="size-full"
        rounded="md"
      />
    </template>
    <template #title>
      <RuiSkeletonLoader class="h-4 w-40" />
    </template>
    <template #subtitle>
      <RuiSkeletonLoader class="h-3.5 w-28" />
    </template>
    <template #badge>
      <RuiSkeletonLoader
        class="h-6 w-32"
        rounded="full"
      />
    </template>
    <template #actions>
      <RuiSkeletonLoader class="h-9 w-28" />
      <RuiSkeletonLoader class="size-9" />
    </template>
  </PaymentCardLayout>
</template>
