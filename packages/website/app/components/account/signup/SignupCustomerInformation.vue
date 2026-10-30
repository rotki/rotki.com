<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupCustomerInformationPayload } from '~/types/signup';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import AuthHeading from '~/components/account/AuthHeading.vue';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';

const modelValue = defineModel<SignupCustomerInformationPayload>({ required: true });

const { externalResults } = defineProps<{
  externalResults: ValidationErrors;
}>();

const emit = defineEmits<{
  back: [];
  next: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { required } = useFormRules();

const form = useZodForm(z.object({
  firstName: required(),
  lastName: required(),
  companyName: z.string(),
  vatId: z.string(),
}), modelValue);
const { errors, touch } = form;

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

watch(() => externalResults, (fieldErrors) => {
  form.setExternalErrors(fieldErrors);
  if (Object.values(fieldErrors).some(Boolean))
    form.validate();
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
          :error-messages="errors('firstName')"
          @update:model-value="updateValue('firstName', $event)"
          @blur="touch('firstName')"
        />
        <RuiTextField
          id="last-name"
          :model-value="modelValue.lastName"
          color="primary"
          autocomplete="family-name"
          dense
          :label="t('auth.signup.customer_information.form.last_name')"
          :error-messages="errors('lastName')"
          @update:model-value="updateValue('lastName', $event)"
          @blur="touch('lastName')"
        />
        <RuiTextField
          id="company-name"
          :model-value="modelValue.companyName"
          color="primary"
          autocomplete="organization"
          dense
          :label="t('auth.signup.customer_information.form.company')"
          :hint="t('auth.signup.customer_information.form.company_hint')"
          :error-messages="errors('companyName')"
          @update:model-value="updateValue('companyName', $event)"
          @blur="touch('companyName')"
        />
        <RuiTextField
          id="vat-id"
          :model-value="modelValue.vatId"
          color="primary"
          dense
          :label="t('auth.signup.customer_information.form.vat_id')"
          :hint="t('auth.signup.customer_information.form.vat_id_hint')"
          :error-messages="errors('vatId')"
          @update:model-value="updateValue('vatId', $event)"
          @blur="touch('vatId')"
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
