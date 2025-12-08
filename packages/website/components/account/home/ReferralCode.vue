<script setup lang="ts">
import type { Component } from 'vue';
import { get } from '@vueuse/shared';
import ReferralCodeSkeleton from '~/components/account/home/ReferralCodeSkeleton.vue';
import CopyButton from '~/components/common/CopyButton.vue';
import BlueskyIcon from '~/components/icons/BlueskyIcon.vue';
import FarcasterIcon from '~/components/icons/FarcasterIcon.vue';
import TwitterIcon from '~/components/icons/TwitterIcon.vue';
import WhatsAppIcon from '~/components/icons/WhatsAppIcon.vue';
import { useReferralCode } from '~/composables/account/use-referral-code';

const { t } = useI18n({ useScope: 'global' });

const {
  public: { baseUrl },
} = useRuntimeConfig();

interface ShareButton {
  icon?: string;
  customIcon?: Component;
  name: string;
  url: string;
  colorClass: string;
}

const {
  hasReferralCode,
  initialLoading,
  loading,
  loadReferralCode,
  createCode,
  referralCode,
  referralData,
} = useReferralCode();

const discountText = computed<string>(() => {
  const data = get(referralData);
  if (!data || !data.hasReferral) {
    return '';
  }

  const { amount, discountType } = data.discount;
  if (discountType === 'Percentage') {
    return t('account.referral_code.discount_percentage', { percentage: amount });
  }
  return t('account.referral_code.discount_amount', { amount });
});

const discountAmount = computed<string>(() => {
  const data = get(referralData);
  if (!data || !data.hasReferral) {
    return '';
  }

  const { amount, discountType } = data.discount;
  if (discountType === 'Percentage') {
    return `${amount}%`;
  }
  return `${amount}€`;
});

const shareUrl = computed<string>(() => {
  const code = get(referralCode);
  if (!code) {
    return `${baseUrl}/products`;
  }
  return `${baseUrl}/products?ref=${encodeURIComponent(code)}`;
});

const shareMessage = computed<string>(() => {
  const code = get(referralCode);
  const discount = get(discountAmount);
  if (!code || !discount) {
    return '';
  }
  return t('account.referral_code.share_message', { discount, code });
});

const shareButtons = computed<ShareButton[]>(() => {
  const message = get(shareMessage);
  const subject = t('account.referral_code.email_subject');
  const url = get(shareUrl);

  return [{
    name: 'Twitter',
    customIcon: TwitterIcon,
    url: `https://x.com/intent/post?text=${encodeURIComponent(`${message} ${url}`)}`,
    colorClass: 'text-[#000000] dark:text-[#FFFFFF]',
  }, {
    name: 'Farcaster',
    customIcon: FarcasterIcon,
    url: `https://farcaster.xyz/~/compose?text=${encodeURIComponent(`${message} ${url}`)}`,
    colorClass: 'text-[#855DCD]',
  }, {
    name: 'Bluesky',
    customIcon: BlueskyIcon,
    url: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${message} ${url}`)}`,
    colorClass: 'text-[#1285FE]',
  }, {
    name: 'WhatsApp',
    customIcon: WhatsAppIcon,
    url: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`,
    colorClass: 'text-[#25D366]',
  }, {
    name: 'Email',
    icon: 'lu-mail',
    url: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
    colorClass: 'text-rui-text-secondary',
  }];
});

async function generateCode(): Promise<void> {
  await createCode();
}

onMounted(async () => {
  await loadReferralCode();
});
</script>

<template>
  <ReferralCodeSkeleton v-if="initialLoading" />
  <div v-else>
    <div class="text-h6 mb-6">
      {{ t('account.referral_code.title') }}
    </div>

    <RuiCard
      variant="flat"
      class="!bg-rui-grey-50 dark:!bg-rui-grey-900 p-1 border border-rui-grey-300 dark:border-rui-grey-800"
    >
      <div
        v-if="hasReferralCode"
        class="min-h-[10rem] space-y-4"
      >
        <div class="text-body-2 text-rui-text-secondary mb-8">
          {{ t('account.referral_code.share_description') }}
        </div>

        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <RuiTextField
            id="referral-code"
            :model-value="referralCode"
            :disabled="loading"
            variant="outlined"
            :label="t('account.referral_code.code')"
            readonly
            dense
            hide-details
            color="primary"
            class="md:flex-1 [&_input]:font-mono"
          >
            <template #append>
              <div class="h-6 border-r border-rui-grey-400 ml-2 mr-1" />
              <CopyButton :model-value="referralCode" />
            </template>
          </RuiTextField>

          <div class="flex items-center gap-3">
            <span class="text-body-2 text-rui-text-secondary">{{ t('account.referral_code.share_via') }}</span>
            <div class="flex items-center gap-2">
              <a
                v-for="button in shareButtons"
                :key="button.name"
                :href="button.url"
                :target="button.name !== 'Email' ? '_blank' : undefined"
                :rel="button.name !== 'Email' ? 'noopener noreferrer' : undefined"
              >
                <RuiButton
                  variant="text"
                  size="sm"
                  color="secondary"
                  class="!p-2 !min-w-0"
                >
                  <Component
                    :is="button.customIcon"
                    v-if="button.customIcon"
                    :class="button.colorClass"
                  />
                  <RuiIcon
                    v-else-if="button.icon"
                    :name="button.icon"
                    size="18"
                    :class="button.colorClass"
                  />
                </RuiButton>
              </a>
            </div>
          </div>
        </div>

        <RuiAlert
          v-if="discountText"
          type="success"
          icon="lu-gift"
          class="border border-rui-success/[0.5]"
        >
          <template #title>
            <b>{{ t('account.referral_code.discount_benefit') }}</b>
          </template>
          {{ discountText }}
        </RuiAlert>

        <RuiAlert
          type="info"
          icon="lu-sparkles"
          class="border border-rui-primary/[0.3]"
        >
          <template #title>
            <b>{{ t('account.referral_code.coming_soon_hint') }}</b>
          </template>
        </RuiAlert>
      </div>

      <div
        v-else
        class="min-h-[10rem] flex flex-col items-center justify-center gap-4"
      >
        <div class="text-body-2 text-rui-text-secondary">
          {{ t('account.referral_code.not_created') }}
        </div>
        <RuiButton
          color="primary"
          :loading="loading"
          @click="generateCode()"
        >
          <template #prepend>
            <RuiIcon
              name="lu-plus"
              size="18"
            />
          </template>
          {{ t('actions.create') }}
        </RuiButton>
      </div>
    </RuiCard>
  </div>
</template>
