<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ul class="list-disc ml-5">
    <li>{{ t('account.subscriptions.cancellation.benefits.line_1') }}</li>
    <li>
      <i18n-t
        keypath="account.subscriptions.cancellation.benefits.line_2"
        scope="global"
      >
        <template #bug_tracker>
          <ButtonLink
            class="underline"
            color="primary"
            external
            inline
            to="https://github.com/rotki/rotki/issues"
          >
            {{ t('account.subscriptions.cancellation.bug_tracker') }}
          </ButtonLink>
        </template>
      </i18n-t>
    </li>
    <li>{{ t('account.subscriptions.cancellation.benefits.line_3') }}</li>
  </ul>
</template>
