<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { minLength, required, sameAs } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';
import { useLogger } from '~/utils/use-logger';
import { toMessages } from '~/utils/validation';
import type { Ref } from 'vue';

const logger = useLogger();

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

function setupFormValidation(
  password: Ref<string>,
  passwordConfirmation: Ref<string>,
  $externalResults: Ref<NonNullable<unknown>>,
) {
  const rules = {
    password: { required, minLength: minLength(8) },
    passwordConfirmation: {
      required,
      sameAsPassword: sameAs(password, 'password'),
    },
  };

  const v$ = useVuelidate(
    rules,
    { password, passwordConfirmation },
    {
      $autoDirty: true,
      $externalResults,
    },
  );

  const valid = computed(() => !get(v$).$invalid);
  return { v$, valid };
}

const password = ref('');
const passwordConfirmation = ref('');
const $externalResults = ref({});

const route = useRoute();
const { uid, token } = route.params;
const submitting = ref<boolean>(false);

async function submit() {
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
const { valid, v$ } = setupFormValidation(
  password,
  passwordConfirmation,
  $externalResults,
);

const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[200px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[360px] max-w-full">
      <div
        v-if="validating"
        class="flex justify-center"
      >
        <RuiProgress
          variant="indeterminate"
          circular
          color="primary"
        />
      </div>
      <div
        v-else-if="!isValid"
        class="space-y-3"
      >
        <div class="text-h4">
          {{ t('auth.password_reset.invalid.title') }}
        </div>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('auth.password_reset.invalid.message') }}
        </div>
      </div>
      <div
        v-else
        class="space-y-8"
      >
        <div class="text-h4">
          {{ t('auth.password_reset.title') }}
        </div>
        <form
          class="space-y-6"
          @submit.prevent=""
        >
          <div class="space-y-5">
            <div class="space-y-1">
              <RuiRevealableTextField
                id="password"
                v-model="password"
                dense
                variant="outlined"
                :label="t('auth.password_reset.form.password')"
                hide-details
                color="primary"
                :error-messages="toMessages(v$.password)"
              />
              <ul class="ml-4 list-disc text-rui-text-secondary text-caption">
                <li>
                  {{ t('auth.common.password_hint.line_1') }}
                </li>
                <li>
                  {{ t('auth.common.password_hint.line_2') }}
                </li>
                <li>
                  {{ t('auth.common.password_hint.line_3') }}
                </li>
                <li>
                  {{ t('auth.common.password_hint.line_4') }}
                </li>
              </ul>
            </div>
            <div>
              <RuiRevealableTextField
                id="password-confirmation"
                v-model="passwordConfirmation"
                dense
                variant="outlined"
                :label="t('auth.password_reset.form.confirm')"
                :hint="t('auth.common.confirm_hint')"
                color="primary"
                :error-messages="toMessages(v$.passwordConfirmation)"
              />
            </div>
          </div>
          <div>
            <RuiButton
              color="primary"
              :disabled="!valid"
              class="w-full"
              size="lg"
              :loading="submitting"
              @click="submit()"
            >
              {{ t('actions.submit') }}
            </RuiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
