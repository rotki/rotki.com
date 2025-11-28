<script setup lang="ts">
import type { ContextColorsType } from '@rotki/ui-library';
import type { RouteLocationRaw } from 'vue-router';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

withDefaults(
  defineProps<{
    color?: ContextColorsType;
    onlyPremium?: boolean;
  }>(),
  {
    onlyPremium: false,
  },
);

const store = useMainStore();
const { account } = storeToRefs(store);

const { referralCode } = useReferralCodeParam();

const allowNavigation = computed<boolean>(() => {
  if (!isDefined(account))
    return true;

  const { emailConfirmed } = get(account);
  return emailConfirmed;
});

const checkoutLink = computed<RouteLocationRaw>(() => {
  const ref = get(referralCode);
  if (ref) {
    return {
      path: '/checkout/pay',
      query: { ref },
    };
  }
  return '/checkout/pay';
});

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <ButtonLink
      v-if="!onlyPremium"
      variant="outlined"
      to="/download"
      size="lg"
      :color="color"
      :class="{ '!outline-white !text-rui-dark-text': !color }"
    >
      {{ t('actions.get_started_for_free') }}
    </ButtonLink>

    <RuiTooltip
      :disabled="allowNavigation"
      tooltip-class="max-w-[20rem]"
    >
      <template #activator>
        <ButtonLink
          :to="checkoutLink"
          size="lg"
          variant="filled"
          :disabled="!allowNavigation"
          :color="color"
        >
          {{ t('actions.get_premium') }}
        </ButtonLink>
      </template>
      {{ t('subscription.error.unverified_email') }}
    </RuiTooltip>
  </div>
</template>
