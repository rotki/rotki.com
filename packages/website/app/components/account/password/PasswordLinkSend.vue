<script setup lang="ts">
import AuthSentTo from '~/components/account/AuthSentTo.vue';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AuthShell
    icon="lu-mail"
    :title="t('auth.password_link_send.title')"
  >
    <template #description>
      <AuthSentTo
        :sent-to="t('auth.password_link_send.sent_to')"
        :fallback="t('auth.password_link_send.your_address')"
        :open-link="t('auth.password_link_send.open_link')"
      />
    </template>
    <i18n-t
      keypath="auth.password_link_send.no_email"
      scope="global"
      tag="p"
      class="rounded-lg bg-rui-grey-100 px-4 py-3 text-body-2 text-rui-text-secondary text-pretty"
    >
      <template #link>
        <NuxtLink
          to="/password/recover"
          external
          class="text-rui-primary hover:underline"
        >
          {{ t('auth.password_link_send.request_again') }}
        </NuxtLink>
      </template>
    </i18n-t>
    <template #footer>
      <ButtonLink
        to="/login"
        inline
        color="primary"
      >
        {{ t('auth.recover_password.back_to_login') }}
      </ButtonLink>
    </template>
  </AuthShell>
</template>
