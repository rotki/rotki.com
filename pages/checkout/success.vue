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
      <div class="flex flex-col gap-3 max-w-[26rem] mx-auto">
        <h4 class="text-h4">
          {{
            crypto
              ? t('subscription.crypto_success.title')
              : t('subscription.success.title')
          }}
        </h4>
        <p class="text-body-1 text-rui-text-secondary">
          {{
            crypto
              ? t('subscription.crypto_success.message')
              : t('subscription.success.message')
          }}
        </p>
        <RuiButton
          class="w-full"
          color="primary"
          @click="navigateTo({ name: 'home-subscription' })"
        >
          {{ t('page_header.manage_premium') }}
        </RuiButton>
      </div>
    </PageContent>
  </PageContainer>
</template>
