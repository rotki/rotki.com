<script lang="ts" setup>
import { email, minLength, required, sameAs } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { useVuelidate } from '@vuelidate/core';
import { toMessages } from '~/utils/validation';
import type { SignupAccountPayload } from '~/types/signup';
import type { ValidationErrors } from '~/types/common';

const props = defineProps<{
  modelValue: SignupAccountPayload;
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'next'): void;
  (e: 'update:model-value', newValue: SignupAccountPayload): void;
}>();

const { modelValue, externalResults } = toRefs(props);

const password = computed(() => get(modelValue).password);

const rules = {
  username: { required },
  password: { required, minLength: minLength(8) },
  confirmPassword: {
    required,
    sameAsPassword: sameAs(password, 'password'),
  },
  email: { required, email },
};

const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(rules, modelValue, {
  $autoDirty: true,
  $externalResults,
});

watch(
  externalResults,
  (errors) => {
    set($externalResults, errors);
    if (Object.values(errors).some(i => !!i))
      get(v$).$validate();
  },
  { immediate: true },
);

function updateValue(field: string, value: any) {
  emit('update:model-value', {
    ...get(modelValue),
    [field]: value,
  });
}

const { t } = useI18n();
</script>

<template>
  <div class="space-y-8 grow">
    <div class="text-h4 text-center">
      {{ t('auth.signup.account.title') }}
    </div>
    <div class="space-y-5">
      <RuiTextField
        id="username"
        :model-value="modelValue.username"
        variant="outlined"
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
        variant="outlined"
        color="primary"
        dense
        autocomplete="email"
        :label="t('auth.common.email')"
        :hint="t('auth.signup.account.form.email_hint')"
        :error-messages="toMessages(v$.email)"
        @update:model-value="updateValue('email', $event)"
      />
      <div class="space-y-1">
        <RuiTextField
          id="password"
          type="password"
          :model-value="modelValue.password"
          variant="outlined"
          color="primary"
          dense
          autocomplete="new-password"
          :label="t('auth.common.password')"
          hide-details
          :error-messages="toMessages(v$.password).length > 0 ? [''] : []"
          @update:model-value="updateValue('password', $event)"
        />
        <ul
          class="ml-4 list-disc text-caption"
          :class="
            toMessages(v$.password).length > 0
              ? 'text-rui-error'
              : 'text-rui-text-secondary'
          "
        >
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
      <RuiTextField
        id="password-confirmation"
        type="password"
        :model-value="modelValue.confirmPassword"
        variant="outlined"
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
  <div class="mt-16 grid md:grid-cols-2 gap-4">
    <RuiButton
      type="button"
      class="w-full row-start-2 md:row-start-auto"
      size="lg"
      data-cy="back-button"
      @click="emit('back')"
    >
      {{ t('actions.back') }}
    </RuiButton>
    <RuiButton
      data-cy="next-button"
      :disabled="v$.$invalid"
      color="primary"
      class="w-full"
      size="lg"
      @click="emit('next')"
    >
      {{ t('actions.continue') }}
    </RuiButton>
  </div>
</template>
