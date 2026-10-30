<script setup lang="ts">
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AuthShell
    icon="lu-circle-check"
    tone="success"
    :title="t('auth.password_changed.title')"
    :description="t('auth.password_changed.message')"
  >
    <ButtonLink
      color="primary"
      variant="default"
      class="w-full"
      size="lg"
      to="/login"
    >
      {{ t('auth.login.title') }}
    </ButtonLink>
  </AuthShell>
</template>
