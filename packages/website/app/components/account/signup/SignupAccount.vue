<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupAccountPayload } from '~/types/signup';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import AuthHeading from '~/components/account/AuthHeading.vue';
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

function updateValue(field: string, value: any): void {
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
    <div class="space-y-8 grow">
      <div class="space-y-4">
        <AuthHeading :title="t('auth.signup.account.heading')" />
        <div
          class="rounded-md bg-rui-primary/5 p-4 space-y-2 text-body-2 text-rui-text-secondary text-pretty"
          data-cy="signup-note"
        >
          <i18n-t
            keypath="auth.signup.introduction.message.default"
            scope="global"
            tag="p"
          >
            <template #premium_subscription>
              <strong class="text-rui-text">
                {{ t('auth.signup.introduction.message.premium_subscription') }}
              </strong>
            </template>
          </i18n-t>
          <i18n-t
            keypath="auth.signup.introduction.free"
            scope="global"
            tag="p"
          >
            <template #download>
              <NuxtLink
                to="/download"
                class="text-rui-primary underline"
              >
                {{ t('auth.signup.introduction.message.download') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </div>
      </div>
      <div class="space-y-5">
        <RuiTextField
          id="username"
          :model-value="modelValue.username"
          autofocus
          color="primary"
          dense
          :label="t('auth.common.username')"
          :hint="t('auth.signup.account.form.username_hint')"
          autocomplete="username"
          :error-messages="errors('username')"
          @update:model-value="updateValue('username', $event)"
        />
        <RuiTextField
          id="email"
          :model-value="modelValue.email"
          color="primary"
          dense
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
