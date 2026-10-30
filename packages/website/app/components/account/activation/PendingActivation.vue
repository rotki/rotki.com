<script setup lang="ts">
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AuthShell
    icon="lu-mail"
    :title="t('auth.pending_activation.title')"
    :description="t('auth.pending_activation.message')"
  >
    <p class="text-body-2 text-rui-text-secondary">
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
