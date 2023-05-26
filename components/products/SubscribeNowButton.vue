<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const { t } = useI18n();

const store = useMainStore();
const { account } = storeToRefs(store);
const hasActiveSubscription = computed(
  () => !!get(account)?.hasActiveSubscription
);

const emailConfirmed = computed(() => get(account)?.emailConfirmed ?? false);
const goToCheckoutPlan = () => navigateTo('/checkout/plan');
const goToAccount = () => navigateTo('/home');
</script>

<template>
  <InfoTooltip v-if="!hasActiveSubscription" :disabled="emailConfirmed">
    <template #activator>
      <ActionButton
        primary
        :disabled="!emailConfirmed"
        @click="goToCheckoutPlan()"
      >
        Subscribe now
      </ActionButton>
    </template>
    <span> {{ t('subscription.error.unverified_email') }}</span>
  </InfoTooltip>
  <ActionButton v-else primary @click="goToAccount()">
    Manage Premium
  </ActionButton>
</template>
