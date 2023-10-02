<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const { t } = useI18n();

const store = useMainStore();
const { account } = storeToRefs(store);
const hasActiveSubscription = computed(
  () => !!get(account)?.hasActiveSubscription,
);

const showTooltip = computed(() => {
  if (!isDefined(account)) {
    return false;
  }

  const { emailConfirmed } = get(account);
  return !emailConfirmed;
});

const allowNavigation = computed(() => {
  if (!isDefined(account)) {
    return true;
  }

  const { emailConfirmed } = get(account);
  return emailConfirmed;
});
</script>

<template>
  <InfoTooltip v-if="!hasActiveSubscription" :disabled="!showTooltip">
    <template #activator>
      <ButtonLink
        variant="default"
        size="lg"
        class="!py-4 !px-10 !text-xl uppercase"
        rounded
        filled
        color="primary"
        :disabled="!allowNavigation"
        to="/checkout/pay"
      >
        Subscribe now
      </ButtonLink>
    </template>
    <span> {{ t('subscription.error.unverified_email') }}</span>
  </InfoTooltip>

  <ButtonLink
    v-else
    variant="default"
    size="lg"
    class="!py-4 !px-10 !text-xl uppercase"
    rounded
    filled
    color="primary"
    to="/home/subscription"
  >
    Manage Premium
  </ButtonLink>
</template>
