<script lang="ts" setup>
import { navigateTo } from '#app';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'authentication', 'unverified', 'subscriber'],
});

useHead({
  title: 'payment success',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Payment for rotki premium subscription completed',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

const { t } = useI18n({ useScope: 'global' });

useAutoLogout();

const route = useRoute();
const crypto = computed(() => !!route.query.crypto);
</script>

<template>
  <PageContainer>
    <PageContent>
      <div class="text-center py-12 max-w-[26rem] mx-auto">
        <!-- Success icon -->
        <div class="mb-6">
          <RuiIcon
            name="lu-circle-check"
            size="64"
            color="success"
            class="mx-auto"
          />
        </div>

        <!-- Success title -->
        <h4 class="text-h4 mb-3">
          {{
            crypto
              ? t('subscription.crypto_success.title')
              : t('subscription.success.title')
          }}
        </h4>

        <!-- Success message -->
        <p class="text-body-1 text-rui-text-secondary mb-8">
          {{
            crypto
              ? t('subscription.crypto_success.message')
              : t('subscription.success.message')
          }}
        </p>

        <!-- Manage Premium button -->
        <RuiButton
          class="w-full max-w-sm mx-auto"
          color="primary"
          @click="navigateTo({ name: 'home-subscription' })"
        >
          {{ t('page_header.manage_premium') }}
        </RuiButton>

        <!-- Success notice with setup link (only for non-crypto payments) -->
        <div
          v-if="!crypto"
          class="text-center mt-4 p-4 bg-rui-grey-50 dark:bg-rui-grey-800 rounded-lg border border-rui-grey-200 dark:border-rui-grey-700"
        >
          <p class="text-xs text-rui-text-secondary">
            {{ t('subscription.3d_secure.payment_complete_notice') }}
            <NuxtLink
              to="https://docs.rotki.com/usage-guides/#set-up-rotki-premium"
              external
              target="_blank"
              class="text-rui-primary underline hover:text-rui-primary-darker font-medium"
            >
              {{ t('subscription.3d_secure.setup_guide') }}
            </NuxtLink>
            {{ t('subscription.3d_secure.get_started_text') }}
          </p>
        </div>

        <!-- Security reassurance -->
        <div class="mt-6 text-center">
          <p class="text-xs text-rui-text-secondary flex items-center justify-center gap-1">
            <RuiIcon
              name="lu-shield-check"
              size="16"
              color="success"
            />
            Your payment details were processed securely
          </p>
        </div>
      </div>
    </PageContent>
  </PageContainer>
</template>
