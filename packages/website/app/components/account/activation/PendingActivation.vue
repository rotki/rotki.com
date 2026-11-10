<script setup lang="ts">
import AuthSentTo from '~/components/account/AuthSentTo.vue';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AuthShell
    icon="lu-mail"
    :title="t('auth.pending_activation.title')"
  >
    <template #description>
      <AuthSentTo
        :sent-to="t('auth.pending_activation.sent_to')"
        :fallback="t('auth.pending_activation.your_address')"
        :open-link="t('auth.pending_activation.open_link')"
      />
    </template>
    <p class="rounded-lg bg-rui-grey-100 px-4 py-3 text-body-2 text-rui-text-secondary text-pretty">
      {{ t('auth.pending_activation.no_email') }}
    </p>
    <template #footer>
      <ButtonLink
        to="/login"
        inline
        color="primary"
      >
        {{ t('auth.login.title') }}
      </ButtonLink>
    </template>
  </AuthShell>
</template>
