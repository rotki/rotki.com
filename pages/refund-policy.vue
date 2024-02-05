<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { t } = useI18n();

const title = 'refund policy';
const description = 'Rotki Refund and Cancellation Policy';

const config = useRuntimeConfig();
const baseUrl = config.public.baseUrl;

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/refund-policy/`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <PageContainer :center-vertically="false">
    <template #title>
      {{ t('policies.refund.title') }}
    </template>
    <p>
      <i18n-t keypath="policies.refund.policy">
        <template #non_refundable>
          <strong>
            {{ t('policies.refund.non_refundable') }}
          </strong>
        </template>
      </i18n-t>
    </p>
  </PageContainer>
</template>

<style lang="scss">
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';
</style>
