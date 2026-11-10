<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupInvoicePayload } from '~/types/signup';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import CountrySelect from '~/components/account/CountrySelect.vue';
import Recaptcha from '~/components/common/Recaptcha.client.vue';
import { useFormRules } from '~/composables/use-form-rules';
import { useRecaptcha } from '~/composables/use-recaptcha';
import { useZodForm } from '~/composables/use-zod-form';

type TextField = Exclude<keyof SignupInvoicePayload, 'newsletterConsent'>;

interface FieldBinding {
  'color': 'primary';
  'dense': true;
  'details': 'auto';
  'modelValue': string;
  'errorMessages': string[];
  'onUpdate:modelValue': (value: string) => void;
  'onBlur': () => void;
}

const modelValue = defineModel<SignupInvoicePayload>({ required: true });

const { email, externalResults, loading } = defineProps<{
  /** The address from the account step, shown so people know which account they are finishing. */
  email: string;
  externalResults: ValidationErrors;
  loading: boolean;
}>();

const emit = defineEmits<{
  back: [];
  finish: [recaptchaToken: string];
}>();

const { t } = useI18n({ useScope: 'global' });

const terms = ref<boolean>(false);
/** Company name and VAT ID only show for company purchases. */
const isCompany = ref<boolean>(!!get(modelValue).companyName || !!get(modelValue).vatId);

const { postcode, required } = useFormRules();

const {
  modelCaptchaId,
  onError,
  onSuccess,
  onExpired,
  recaptchaPassed,
  recaptchaToken,
  resetCaptcha,
} = useRecaptcha();

const form = useZodForm(z.object({
  firstName: required(),
  lastName: required(),
  companyName: z.string(),
  vatId: z.string(),
  country: required(),
  address1: required(),
  address2: z.string(),
  postcode: postcode(),
  city: required(),
  newsletterConsent: z.boolean(),
  captcha: required(),
  terms: z.boolean().refine(accepted => accepted, { error: t('auth.signup.invoice.form.tos_required') }),
}), () => ({
  ...get(modelValue),
  // A token the widget later reported an error for does not count as a passed captcha.
  captcha: get(recaptchaPassed) ? get(recaptchaToken) : '',
  terms: get(terms),
}));
const { errors, hasError, touch } = form;

function updateValue<K extends keyof SignupInvoicePayload>(field: K, value: SignupInvoicePayload[K]): void {
  set(modelValue, {
    ...get(modelValue),
    [field]: value,
  });
}

/** Everything a text field of this form binds, so each field only names itself once. */
function field(name: TextField): FieldBinding {
  return {
    'color': 'primary',
    'dense': true,
    'details': 'auto',
    'modelValue': get(modelValue)[name],
    'errorMessages': errors(name),
    'onUpdate:modelValue': (value: string) => updateValue(name, value),
    'onBlur': () => touch(name),
  };
}

/** Closing the company fields drops what was typed there, so a personal purchase sends no company. */
function setCompany(value: boolean): void {
  set(isCompany, value);
  if (!value) {
    set(modelValue, {
      ...get(modelValue),
      companyName: '',
      vatId: '',
    });
  }
}

function setCaptchaId(id: number): void {
  set(modelCaptchaId, id);
}

function finish(): void {
  if (form.validate())
    emit('finish', get(recaptchaToken));
}

// A rejected signup has used up the captcha token, so it has to be solved again.
watch(() => externalResults, (fieldErrors) => {
  form.setExternalErrors(fieldErrors);
  if (fieldErrors.companyName || fieldErrors.vatId)
    set(isCompany, true);
  if (Object.values(fieldErrors).some(Boolean)) {
    resetCaptcha();
    form.validate();
  }
}, { immediate: true });
</script>

<template>
  <form @submit.prevent="finish()">
    <h1 class="text-h5 md:text-h4 text-rui-text text-pretty">
      {{ t('auth.signup.invoice.heading') }}
    </h1>
    <!-- On large screens the side panel says this and names the account. -->
    <div class="lg:hidden">
      <p class="mt-3 text-body-1 text-rui-text-secondary text-pretty">
        {{ t('auth.signup.invoice.description') }}
      </p>
      <div
        class="mt-4 flex items-center justify-between gap-3 rounded-lg bg-rui-grey-100 pl-4 pr-1 py-1 text-body-2 text-rui-text-secondary"
        data-cy="signing-up-as"
      >
        <span class="min-w-0 truncate">
          {{ t('auth.signup.aside.invoice.signing_up_as') }}
          <strong class="font-medium text-rui-text">{{ email }}</strong>
        </span>
        <RuiButton
          variant="text"
          color="primary"
          size="sm"
          class="shrink-0"
          @click="emit('back')"
        >
          {{ t('auth.signup.aside.invoice.edit') }}
        </RuiButton>
      </div>
    </div>

    <div class="mt-7 space-y-7">
      <fieldset class="space-y-4">
        <legend class="mb-4 text-overline font-semibold text-rui-text-secondary">
          {{ t('auth.signup.invoice.name_section') }}
        </legend>
        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <RuiTextField
            id="first-name"
            v-bind="field('firstName')"
            autofocus
            autocomplete="given-name"
            :label="t('auth.signup.customer_information.form.first_name')"
          />
          <RuiTextField
            id="last-name"
            v-bind="field('lastName')"
            autocomplete="family-name"
            :label="t('auth.signup.customer_information.form.last_name')"
          />
        </div>
        <RuiCheckbox
          id="is-company"
          :model-value="isCompany"
          color="primary"
          hide-details
          @update:model-value="setCompany($event)"
        >
          {{ t('auth.signup.invoice.company_toggle') }}
        </RuiCheckbox>
        <div
          v-if="isCompany"
          class="space-y-4 md:pl-8"
          data-cy="company-fields"
        >
          <RuiTextField
            id="company-name"
            v-bind="field('companyName')"
            autocomplete="organization"
            :label="t('auth.signup.customer_information.form.company')"
            :hint="t('auth.signup.invoice.form.company_hint')"
          />
          <RuiTextField
            id="vat-id"
            v-bind="field('vatId')"
            :label="t('auth.signup.invoice.form.vat_id')"
          />
        </div>
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="mb-4 text-overline font-semibold text-rui-text-secondary">
          {{ t('auth.signup.invoice.address_section') }}
        </legend>
        <CountrySelect v-bind="field('country')" />
        <RuiTextField
          id="address-1"
          v-bind="field('address1')"
          maxlength="128"
          autocomplete="address-line1"
          :label="t('auth.signup.invoice.form.address_line_1')"
        />
        <RuiTextField
          id="address-2"
          v-bind="field('address2')"
          maxlength="128"
          autocomplete="address-line2"
          :label="t('auth.signup.invoice.form.address_line_2')"
        />
        <div class="grid grid-cols-[8rem_minmax(0,1fr)] md:grid-cols-[10rem_minmax(0,1fr)] gap-3 md:gap-4">
          <RuiTextField
            id="postal"
            data-cy="postal"
            v-bind="field('postcode')"
            autocomplete="postal-code"
            :label="t('auth.signup.address.form.postal_code')"
          />
          <RuiTextField
            id="city"
            v-bind="field('city')"
            autocomplete="address-level2"
            :label="t('auth.signup.address.form.city')"
          />
        </div>
      </fieldset>

      <div class="pt-6 border-t border-default space-y-4">
        <Recaptcha
          id="signup-captcha"
          :invalid="hasError('captcha')"
          @error="onError()"
          @expired="onExpired()"
          @success="onSuccess($event)"
          @captcha-id="setCaptchaId($event)"
        />
        <div class="text-pretty space-y-1">
          <RuiCheckbox
            id="tos"
            v-model="terms"
            color="primary"
            details="auto"
            :error-messages="errors('terms')"
          >
            <i18n-t
              keypath="auth.signup.invoice.form.tos"
              scope="global"
            >
              <template #tos>
                <NuxtLink
                  to="/tos"
                  external
                  target="_blank"
                  class="text-rui-primary hover:underline"
                >
                  {{ t('navigation_menu.tos') }}
                </NuxtLink>
              </template>
              <template #privacy_policy>
                <NuxtLink
                  to="/privacy-policy"
                  external
                  target="_blank"
                  class="text-rui-primary hover:underline"
                >
                  {{ t('navigation_menu.privacy_policy') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </RuiCheckbox>
          <RuiCheckbox
            id="newsletter-consent"
            :model-value="modelValue.newsletterConsent"
            color="primary"
            hide-details
            @update:model-value="updateValue('newsletterConsent', $event)"
          >
            {{ t('auth.signup.invoice.form.newsletter_consent') }}
            <span class="text-rui-text-secondary">{{ t('auth.signup.invoice.form.optional') }}</span>
          </RuiCheckbox>
        </div>
      </div>
    </div>

    <!-- On phones the actions stay at the bottom of the screen while the form scrolls. -->
    <div class="sticky bottom-0 z-[5] -mx-4 mt-8 flex gap-3 border-t border-default bg-white px-4 pt-3 pb-4 md:static md:mx-0 md:border-0 md:p-0">
      <RuiButton
        data-cy="back-button"
        type="button"
        variant="outlined"
        size="lg"
        @click="emit('back')"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        data-cy="submit-button"
        type="submit"
        :disabled="loading"
        color="primary"
        class="flex-1"
        size="lg"
        :loading="loading"
      >
        {{ t('auth.signup.create_account') }}
      </RuiButton>
    </div>
  </form>
</template>
