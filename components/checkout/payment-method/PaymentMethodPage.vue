<script setup lang="ts">
const route = useRoute();

onBeforeMount(() => {
  if (!('p' in route.query)) {
    navigateTo('/checkout/plan');
  }
});

const subscriptionIdentifier = computed(() =>
  'id' in route.query ? (route.query.id as string) : undefined,
);
</script>

<template>
  <PageContainer wide :center-vertically="false">
    <template #title> Select a Payment method </template>
    <PageContent>
      <PaymentMethodSelection :identifier="subscriptionIdentifier" />
    </PageContent>
  </PageContainer>
</template>
