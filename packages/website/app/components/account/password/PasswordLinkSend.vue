<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });

const email = ref<string>();

const description = computed<string>(() => {
  const address = get(email);
  return address
    ? t('auth.password_link_send.message_with_email', { email: address })
    : t('auth.password_link_send.message');
});

// The recovery form passes the address in history state; read it after mount so the prerendered page hydrates cleanly.
onMounted(() => {
  const address: unknown = window.history.state?.email;
  if (typeof address === 'string' && address)
    set(email, address);
});
</script>

<template>
  <AuthShell
    icon="lu-mail"
    :title="t('auth.password_link_send.title')"
    :description="description"
  >
    <i18n-t
      keypath="auth.password_link_send.no_email"
      scope="global"
      tag="p"
      class="text-body-2 text-rui-text-secondary"
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
