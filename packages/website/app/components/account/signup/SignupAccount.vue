<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupAccountPayload } from '~/types/signup';
import { useVuelidate } from '@vuelidate/core';
import { email, required, sameAs } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import AuthHeading from '~/components/account/AuthHeading.vue';
import PasswordRules from '~/components/account/PasswordRules.vue';
import { passwordValidators, toMessages } from '~/utils/validation';

const modelValue = defineModel<SignupAccountPayload>({ required: true });

const { externalResults } = defineProps<{
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  next: [];
}>();

const $externalResults = ref<Record<string, string[]>>({});
const attempted = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

const password = computed<string>(() => get(modelValue).password);

const rules = {
  username: { required },
  password: passwordValidators,
  confirmPassword: {
    required,
    sameAsPassword: sameAs(password, 'password'),
  },
  email: { required, email },
};

const v$ = useVuelidate(rules, modelValue, {
  $autoDirty: true,
  $externalResults,
});

async function next(): Promise<void> {
  set(attempted, true);
  if (await get(v$).$validate())
    emit('next');
}

function updateValue(field: string, value: any): void {
  set(modelValue, {
    ...get(modelValue),
    [field]: value,
  });
}

watch(() => externalResults, (errors) => {
  set($externalResults, errors);
  if (Object.values(errors).some(i => !!i))
    get(v$).$validate();
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
          :error-messages="toMessages(v$.username)"
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
          :error-messages="toMessages(v$.email)"
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
            :error-messages="attempted ? toMessages(v$.password) : []"
            @update:model-value="updateValue('password', $event)"
          />
          <PasswordRules
            :password="modelValue.password"
            :errors="$externalResults.password"
            :invalid="attempted && v$.password.$error"
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
          :error-messages="toMessages(v$.confirmPassword)"
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
