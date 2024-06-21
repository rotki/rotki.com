<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';
import type { ContextColorsType } from '@rotki/ui-library';

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
const hasActiveSubscription = computed(
  () => !!get(account)?.hasActiveSubscription,
);

const allowNavigation = computed(() => {
  if (!isDefined(account))
    return true;

  const { emailConfirmed } = get(account);
  return emailConfirmed;
});

const { t } = useI18n();
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
      v-if="!hasActiveSubscription"
      :disabled="allowNavigation"
      tooltip-class="max-w-[20rem]"
    >
      <template #activator>
        <ButtonLink
          to="/checkout/pay"
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
    <ButtonLink
      v-else
      to="/home/subscription"
      size="lg"
      variant="filled"
      :color="color"
    >
      {{ t('page_header.manage_premium') }}
    </ButtonLink>
  </div>
</template>
