<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupAccountPayload } from '~/types/signup';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import PasswordRules from '~/components/account/PasswordRules.vue';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';

const modelValue = defineModel<SignupAccountPayload>({ required: true });

const { externalResults } = defineProps<{
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  next: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { email, password, required } = useFormRules();

const form = useZodForm(z.object({
  username: required(),
  email: email(),
  password: password(),
  confirmPassword: required(),
}).refine(value => value.password === value.confirmPassword, {
  error: t('validation.passwords_differ'),
  path: ['confirmPassword'],
}), modelValue);
const { errors, hasError, serverErrors, submitted } = form;

function next(): void {
  if (form.validate())
    emit('next');
}

function updateValue(field: keyof SignupAccountPayload, value: string): void {
  set(modelValue, {
    ...get(modelValue),
    [field]: value,
  });
}

// Backend errors bring the user back to this step, so mark it as submitted to show them in full.
watch(() => externalResults, (fieldErrors) => {
  form.setExternalErrors(fieldErrors);
  if (Object.values(fieldErrors).some(Boolean))
    form.validate();
}, { immediate: true });
</script>

<template>
  <form @submit.prevent="next()">
    <h1 class="text-h5 md:text-h4 text-rui-text text-pretty">
      {{ t('auth.signup.account.heading') }}
    </h1>
    <!-- On large screens the side panel says this. -->
    <div class="lg:hidden mt-3">
      <p class="text-body-1 text-rui-text-secondary text-pretty">
        {{ t('auth.signup.account.intro') }}
      </p>
      <details
        class="mt-1"
        data-cy="signup-note"
      >
        <summary class="cursor-pointer py-2 text-body-1 font-medium text-rui-primary">
          {{ t('auth.signup.account.app_login.question') }}
        </summary>
        <p class="mt-1 rounded-lg bg-rui-grey-100 px-4 py-3 text-body-2 text-rui-text-secondary text-pretty">
          {{ t('auth.signup.account.app_login.answer') }}
        </p>
      </details>
    </div>

    <div class="mt-6 lg:mt-7 space-y-5">
      <RuiTextField
        id="username"
        :model-value="modelValue.username"
        autofocus
        color="primary"
        dense
        :label="t('auth.common.username')"
        :hint="t('auth.signup.account.form.username_hint')"
        autocomplete="username"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        :error-messages="errors('username')"
        @update:model-value="updateValue('username', $event)"
      />
      <RuiTextField
        id="email"
        :model-value="modelValue.email"
        color="primary"
        dense
        type="email"
        inputmode="email"
        autocapitalize="off"
        autocomplete="email"
        :label="t('auth.common.email')"
        :hint="t('auth.signup.account.form.email_hint')"
        :error-messages="errors('email')"
        @update:model-value="updateValue('email', $event)"
      />
      <div class="space-y-2">
        <RuiRevealableTextField
          id="password"
          :model-value="modelValue.password"
          color="primary"
          dense
          autocomplete="new-password"
          :label="t('auth.common.password')"
          details="hidden"
          :error-messages="submitted ? errors('password') : []"
          @update:model-value="updateValue('password', $event)"
        />
        <PasswordRules
          :password="modelValue.password"
          :errors="serverErrors('password')"
          :invalid="submitted && hasError('password')"
        />
      </div>
      <RuiRevealableTextField
        id="password-confirmation"
        :model-value="modelValue.confirmPassword"
        color="primary"
        autocomplete="new-password"
        dense
        :label="t('auth.signup.account.form.confirm_password')"
        :hint="t('auth.common.confirm_hint')"
        :error-messages="errors('confirmPassword')"
        @update:model-value="updateValue('confirmPassword', $event)"
      />
    </div>
    <RuiButton
      data-cy="next-button"
      color="primary"
      class="mt-8 w-full"
      size="lg"
      type="submit"
    >
      {{ t('actions.continue') }}
    </RuiButton>
  </form>
</template>
