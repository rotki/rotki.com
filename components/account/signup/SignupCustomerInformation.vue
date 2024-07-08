<script lang="ts" setup>
import { required } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { useVuelidate } from '@vuelidate/core';
import { toMessages } from '~/utils/validation';
import type { SignupCustomerInformationPayload } from '~/types/signup';
import type { ValidationErrors } from '~/types/common';

const props = defineProps<{
  modelValue: SignupCustomerInformationPayload;
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'next'): void;
  (e: 'update:model-value', newValue: SignupCustomerInformationPayload): void;
}>();

const { modelValue, externalResults } = toRefs(props);

const rules = {
  firstName: { required },
  lastName: { required },
  companyName: {},
  vatId: {},
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
      {{ t('auth.signup.customer_information.title') }}
    </div>
    <div class="space-y-5">
      <RuiTextField
        id="first-name"
        :model-value="modelValue.firstName"
        variant="outlined"
        color="primary"
        autocomplete="given-name"
        dense
        :label="t('auth.signup.customer_information.form.first_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="toMessages(v$.firstName)"
        @update:model-value="updateValue('firstName', $event)"
        @blur="v$.firstName.$touch()"
      />
      <RuiTextField
        id="last-name"
        :model-value="modelValue.lastName"
        variant="outlined"
        color="primary"
        autocomplete="family-name"
        dense
        :label="t('auth.signup.customer_information.form.last_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="toMessages(v$.lastName)"
        @update:model-value="updateValue('lastName', $event)"
        @blur="v$.lastName.$touch()"
      />
      <RuiTextField
        id="company-name"
        :model-value="modelValue.companyName"
        variant="outlined"
        color="primary"
        autocomplete="organization"
        dense
        :label="t('auth.signup.customer_information.form.company')"
        :hint="t('auth.signup.customer_information.form.company_hint')"
        :error-messages="toMessages(v$.companyName)"
        @update:model-value="updateValue('companyName', $event)"
        @blur="v$.companyName.$touch()"
      />
      <RuiTextField
        id="vat-id"
        :model-value="modelValue.vatId"
        variant="outlined"
        color="primary"
        dense
        :label="t('auth.signup.customer_information.form.vat_id')"
        :hint="t('auth.signup.customer_information.form.vat_id_hint')"
        :error-messages="toMessages(v$.vatId)"
        @update:model-value="updateValue('vatId', $event)"
        @blur="v$.vatId.$touch()"
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
