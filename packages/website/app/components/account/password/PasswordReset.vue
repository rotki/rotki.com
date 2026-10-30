<script setup lang="ts">
import { SigilEvents } from '@rotki/sigil';
import { useVuelidate } from '@vuelidate/core';
import { required, sameAs } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import AuthShell from '~/components/account/AuthShell.vue';
import PasswordRules from '~/components/account/PasswordRules.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';
import { passwordValidators, toMessages } from '~/utils/validation';

const logger = useLogger();
const { fetchWithCsrf } = useFetchWithCsrf();
const { chronicle } = useSigilEvents();

function setupTokenValidation() {
  const route = useRoute();
  const { uid, token } = route.params;
  const validating = ref<boolean>(true);
  const isValid = ref<boolean>(true);

  const validateToken = async () => {
    try {
      await fetchWithCsrf<void>('/webapi/password-reset/validate/', {
        method: 'POST',
        body: {
          uid,
          token,
        },
      });
    }
    catch (error: any) {
      if (!(error instanceof FetchError && error.status === 404))
        logger.error(error);

      set(isValid, false);
    }
    finally {
      set(validating, false);
    }
  };

  onMounted(async () => await validateToken());
  return { validating, isValid };
}

const password = ref<string>('');
const passwordConfirmation = ref<string>('');
const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(
  {
    password: passwordValidators,
    passwordConfirmation: {
      required,
      sameAsPassword: sameAs(password, 'password'),
    },
  },
  { password, passwordConfirmation },
  {
    $autoDirty: true,
    $externalResults,
  },
);

const route = useRoute();
const { uid, token } = route.params;
const submitting = ref<boolean>(false);
const attempted = ref<boolean>(false);

async function submit(): Promise<void> {
  set(attempted, true);
  if (!await get(v$).$validate())
    return;

  set(submitting, true);
  try {
    await fetchWithCsrf<void>('/webapi/password-reset/confirm/', {
      method: 'POST',
      body: {
        uid,
        token,
        password: get(password),
        password_confirmation: get(passwordConfirmation),
      },
    });
    chronicle(SigilEvents.PASSWORD_RESET_COMPLETED, {});
    await navigateTo({
      path: '/password/changed',
    });
  }
  catch (error: any) {
    if (error instanceof FetchError && error.status === 400) {
      const message = error.data.message;
      if (message && typeof message === 'object') {
        set($externalResults, {
          password: message.password,
          passwordConfirmation: message.password_confirmation,
        });
      }
    }
    else {
      logger.error(error);
    }
  }
  finally {
    set(submitting, false);
  }
}

const { validating, isValid } = setupTokenValidation();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AuthShell
    v-if="validating"
    loading
  />
  <AuthShell
    v-else-if="!isValid"
    icon="lu-link-2-off"
    tone="error"
    :title="t('auth.password_reset.invalid.title')"
    :description="t('auth.password_reset.invalid.message')"
  >
    <ButtonLink
      color="primary"
      variant="default"
      class="w-full"
      size="lg"
      to="/password/recover"
    >
      {{ t('auth.password_reset.invalid.request_new') }}
    </ButtonLink>
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
  <AuthShell
    v-else
    :title="t('auth.password_reset.title')"
  >
    <form
      class="space-y-6"
      @submit.prevent="submit()"
    >
      <div class="space-y-5">
        <div class="space-y-2">
          <RuiRevealableTextField
            id="password"
            v-model="password"
            dense
            autofocus
            autocomplete="new-password"
            :label="t('auth.password_reset.form.password')"
            details="hidden"
            color="primary"
            :error-messages="attempted ? toMessages(v$.password) : []"
          />
          <PasswordRules
            :password="password"
            :errors="$externalResults.password"
            :invalid="attempted && v$.password.$error"
          />
        </div>
        <RuiRevealableTextField
          id="password-confirmation"
          v-model="passwordConfirmation"
          dense
          autocomplete="new-password"
          :label="t('auth.password_reset.form.confirm')"
          :hint="t('auth.common.confirm_hint')"
          color="primary"
          :error-messages="toMessages(v$.passwordConfirmation)"
        />
      </div>
      <RuiButton
        color="primary"
        class="w-full"
        size="lg"
        type="submit"
        :disabled="submitting"
        :loading="submitting"
      >
        {{ t('auth.password_reset.title') }}
      </RuiButton>
    </form>
  </AuthShell>
</template>
