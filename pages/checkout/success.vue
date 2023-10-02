<script lang="ts" setup>
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber',
    'csp',
  ],
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

const { t } = useI18n();

useAutoLogout();
</script>

<template>
  <PageContainer>
    <PageContent>
      <div class="flex flex-col gap-3 max-w-[26rem] mx-auto">
        <h4 class="text-h4">{{ t('subscription.success.title') }}</h4>
        <p class="text-body-1 text-rui-text-secondary">
          {{ t('subscription.success.message') }}
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
