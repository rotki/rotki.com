<script lang="ts" setup>
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account, userSubscriptions } = storeToRefs(store);
const { refreshUserData } = store;

const premium = computed(() => get(account)?.canUsePremium ?? false);
const emailConfirmed = computed(() => get(account)?.emailConfirmed ?? false);
const pending = computed(() => get(userSubscriptions).filter(sub => sub.pending));

const canUsePremium = computed(() => {
  const arePending = get(pending);
  return get(account)?.canUsePremium || arePending.length > 0;
});

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});

onBeforeMount(() => {
  refreshUserData();
});
</script>

<template>
  <div class="space-y-10">
    <UnverifiedEmailWarning v-if="!emailConfirmed" />
    <PremiumPlaceholder v-else-if="!canUsePremium" />
    <ApiKeys v-if="premium" />
    <SubscriptionTable v-if="emailConfirmed" />
    <PaymentsTable />
  </div>
</template>
