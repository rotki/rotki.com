<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupCustomerInformationPayload } from '~/types/signup';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import AuthHeading from '~/components/account/AuthHeading.vue';
import { toMessages } from '~/utils/validation';

const modelValue = defineModel<SignupCustomerInformationPayload>({ required: true });

const { externalResults } = defineProps<{
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  back: [];
  next: [];
}>();

const rules = {
  firstName: { required },
  lastName: { required },
  companyName: {},
  vatId: {},
};

const { t } = useI18n({ useScope: 'global' });

const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(rules, modelValue, {
  $autoDirty: true,
  $externalResults,
});

async function next(): Promise<void> {
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
      <AuthHeading
        :title="t('auth.signup.customer_information.heading')"
        :description="t('auth.signup.customer_information.description')"
      />
      <div class="space-y-5">
        <RuiTextField
          id="first-name"
          :model-value="modelValue.firstName"
          autofocus
          color="primary"
          autocomplete="given-name"
          dense
          :label="t('auth.signup.customer_information.form.first_name')"
          :error-messages="toMessages(v$.firstName)"
          @update:model-value="updateValue('firstName', $event)"
          @blur="v$.firstName.$touch()"
        />
        <RuiTextField
          id="last-name"
          :model-value="modelValue.lastName"
          color="primary"
          autocomplete="family-name"
          dense
          :label="t('auth.signup.customer_information.form.last_name')"
          :error-messages="toMessages(v$.lastName)"
          @update:model-value="updateValue('lastName', $event)"
          @blur="v$.lastName.$touch()"
        />
        <RuiTextField
          id="company-name"
          :model-value="modelValue.companyName"
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
    <div class="mt-8 flex gap-3">
      <RuiButton
        type="button"
        variant="outlined"
        size="lg"
        data-cy="back-button"
        @click="emit('back')"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        data-cy="next-button"
        color="primary"
        class="flex-1"
        size="lg"
        type="submit"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </form>
</template>
