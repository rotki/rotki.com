<script setup lang="ts">
import { LoginFailedReasons, SigilEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';
import { useMainStore } from '~/store';
import { getSingleRouteParam } from '~/utils/query';
import { getSafeRedirectUrl } from '~/utils/redirect';

const username = ref<string>('');
const password = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string>('');
const hadError = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

const { required } = useFormRules();

const form = useZodForm(z.object({
  username: required(t('auth.login.username_required')),
  password: z.string().min(1, { error: t('auth.login.password_required') }),
}), () => ({ username: get(username), password: get(password) }));
const { errors, hasError } = form;

const { login } = useMainStore();
const route = useRoute();
const { chronicle } = useSigilEvents();

onMounted(() => {
  chronicle(SigilEvents.LOGIN_STARTED, {});
});

/**
 * The field's own error when it is empty. After a failed sign in it is the server error, which marks
 * the field without repeating the text: the field's details are hidden then, and the alert shows it.
 */
function fieldMessages(field: 'username' | 'password'): string[] {
  const own = errors(field);
  if (own.length > 0)
    return own;
  const serverError = get(error);
  return serverError ? [serverError] : [];
}

async function performLogin(): Promise<void> {
  if (get(loading) || !form.validate())
    return;

  set(loading, true);
  set(
    error,
    await login({
      username: get(username),
      password: get(password),
    }),
  );
  set(loading, false);

  if (!get(error)) {
    chronicle(SigilEvents.LOGIN_COMPLETED, {});
    const redirectUrl = getSingleRouteParam(route.query.redirectUrl);
    if (redirectUrl)
      window.location.href = getSafeRedirectUrl(redirectUrl);
    else
      await navigateTo('/home/subscription');
  }
  else {
    chronicle(SigilEvents.LOGIN_FAILED, { reason: LoginFailedReasons.INVALID_CREDENTIALS });
    set(hadError, true);
  }
}
</script>

<template>
  <AuthShell
    :title="t('auth.login.title')"
    :description="t('auth.login.message')"
  >
    <form @submit.prevent="performLogin()">
      <div class="space-y-5">
        <RuiTextField
          id="username"
          v-model="username"
          dense
          autofocus
          :disabled="loading"
          :label="t('auth.login.email_or_username')"
          autocomplete="username"
          :details="hasError('username') ? 'auto' : 'hidden'"
          color="primary"
          :error-messages="fieldMessages('username')"
          @focus="error = ''"
        />

        <RuiRevealableTextField
          id="password"
          v-model="password"
          :disabled="loading"
          dense
          :label="t('auth.common.password')"
          autocomplete="current-password"
          :details="hasError('password') ? 'auto' : 'hidden'"
          color="primary"
          :error-messages="fieldMessages('password')"
          @focus="error = ''"
        />
      </div>

      <div class="flex justify-end mt-2 mb-6">
        <ButtonLink
          to="/password/recover"
          :disabled="loading"
          inline
          color="primary"
        >
          {{ t('auth.login.forgot_password') }}
        </ButtonLink>
      </div>

      <RuiAlert
        v-if="hadError"
        class="mb-6"
        role="alert"
        type="error"
        :title="error || undefined"
        :description="t('auth.login.alert_error')"
      />

      <RuiButton
        :disabled="loading"
        color="primary"
        :loading="loading"
        class="w-full"
        size="lg"
        type="submit"
      >
        {{ t('auth.login.title') }}
      </RuiButton>
    </form>
    <template #footer>
      {{ t('auth.login.no_account') }}
      <ButtonLink
        :to="{
          path: '/signup',
          query: route.query,
        }"
        inline
        color="primary"
      >
        {{ t('auth.login.create_account') }}
      </ButtonLink>
    </template>
  </AuthShell>
</template>
