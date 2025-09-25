<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { t } = useI18n({ useScope: 'global' });

const title = 'refund policy';
const description = 'Rotki Refund and Cancellation Policy';

useHead({
  title,
  meta: getMetadata(title, description, '/refund-policy/'),
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
@use '@/assets/css/media';
@use '@/assets/css/main';
</style>
