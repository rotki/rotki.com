<script setup lang="ts">
import { RuiButton, RuiIcon, RuiSkeletonLoader } from '@rotki/ui-library/components';
import { get } from '@vueuse/shared';
import { nextTick, onMounted, useId, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import CopyButton from '~/components/common/CopyButton.vue';
import { useReferralCode } from '~/composables/account/use-referral-code';

const { t } = useI18n({ useScope: 'global' });

const labelId = useId();

const {
  createCode,
  hasReferralCode,
  initialLoading,
  loadReferralCode,
  loading,
  referralCode,
} = useReferralCode();

const codeGroup = useTemplateRef<HTMLElement>('codeGroup');

onMounted(async () => {
  await loadReferralCode();
});

/** The create button disappears once the code exists, so focus moves to the copy button instead of the page start. */
async function create(): Promise<void> {
  await createCode();
  if (!get(hasReferralCode))
    return;
  await nextTick();
  get(codeGroup)?.querySelector<HTMLButtonElement>('button')?.focus();
}
</script>

<template>
  <div class="flex flex-col items-start gap-1.5">
    <span
      :id="labelId"
      class="text-body-2 text-rui-text-secondary"
    >
      {{ t('account.overview.referral_code') }}
    </span>
    <RuiSkeletonLoader
      v-if="initialLoading"
      class="h-9 w-40"
    />
    <div
      v-else-if="hasReferralCode"
      ref="codeGroup"
      role="group"
      :aria-labelledby="labelId"
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-default py-0.5 pl-3 pr-0.5"
    >
      <span
        class="min-w-0 truncate font-mono text-body-1 text-rui-text"
        data-testid="overview-referral-code"
      >
        {{ referralCode }}
      </span>
      <CopyButton :model-value="referralCode" />
    </div>
    <RuiButton
      v-else
      color="primary"
      variant="outlined"
      size="sm"
      :loading="loading"
      @click="create()"
    >
      <template #prepend>
        <RuiIcon
          name="lu-plus"
          size="16"
        />
      </template>
      {{ t('account.overview.create_referral_code') }}
    </RuiButton>
  </div>
</template>
