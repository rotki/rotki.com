<script lang="ts" setup>
import type { ValidationErrors } from '~/types/common';
import type { SignupAddressPayload } from '~/types/signup';
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import AuthHeading from '~/components/account/AuthHeading.vue';
import CountrySelect from '~/components/account/CountrySelect.vue';
import Recaptcha from '~/components/common/Recaptcha.client.vue';
import { useFormRules } from '~/composables/use-form-rules';
import { useRecaptcha } from '~/composables/use-recaptcha';
import { useZodForm } from '~/composables/use-zod-form';

const modelValue = defineModel<SignupAddressPayload>({ required: true });
const captchaId = defineModel<number | undefined>('captchaId');

const { externalResults, loading } = defineProps<{
  externalResults: ValidationErrors;
  loading: boolean;
}>();

const emit = defineEmits<{
  back: [];
  finish: [
    events: {
      recaptchaToken: string;
      onExpired: () => void;
    },
  ];
}>();

const terms = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });
const { required } = useFormRules();

const {
  onError,
  onSuccess,
  onExpired,
  recaptchaPassed,
  recaptchaToken,
} = useRecaptcha();

const form = useZodForm(z.object({
  address1: required(),
  address2: z.string(),
  city: required(),
  postcode: required().regex(/^[\d\sa-z-]+$/i, { error: t('validation.postcode') }),
  country: required(),
  newsletterConsent: z.boolean(),
  captcha: required(),
  terms: z.boolean().refine(accepted => accepted, { error: t('auth.signup.address.form.tos_required') }),
}), () => ({
  ...get(modelValue),
  // A token the widget later reported an error for does not count as a passed captcha.
  captcha: get(recaptchaPassed) ? get(recaptchaToken) : '',
  terms: get(terms),
}));
const { errors, hasError, touch } = form;

function updateValue(field: string, value: any): void {
  set(modelValue, {
    ...get(modelValue),
    [field]: value,
  });
}

function setCaptchaId(id: number): void {
  set(captchaId, id);
}

function finish(): void {
  if (!form.validate())
    return;

  emit('finish', {
    recaptchaToken: get(recaptchaToken),
    onExpired,
  });
}

watch(() => externalResults, (fieldErrors) => {
  form.setExternalErrors(fieldErrors);
  if (Object.values(fieldErrors).some(Boolean))
    form.validate();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8 grow">
    <AuthHeading
      :title="t('auth.signup.address.heading')"
      :description="t('auth.signup.address.description')"
    />
    <div class="space-y-5">
      <RuiTextField
        id="address-1"
        maxlength="128"
        :model-value="modelValue.address1"
        color="primary"
        autocomplete="address-line1"
        autofocus
        dense
        :label="t('auth.signup.address.form.address_line_1')"
        :error-messages="errors('address1')"
        @update:model-value="updateValue('address1', $event)"
        @blur="touch('address1')"
      />
      <RuiTextField
        id="address-2"
        maxlength="128"
        :model-value="modelValue.address2"
        color="primary"
        autocomplete="address-line2"
        dense
        :label="t('auth.signup.address.form.address_line_2')"
        :hint="t('auth.common.optional')"
        :error-messages="errors('address2')"
        @update:model-value="updateValue('address2', $event)"
        @blur="touch('address2')"
      />
      <RuiTextField
        id="city"
        :model-value="modelValue.city"
        color="primary"
        autocomplete="address-level2"
        dense
        :label="t('auth.signup.address.form.city')"
        :error-messages="errors('city')"
        @update:model-value="updateValue('city', $event)"
        @blur="touch('city')"
      />
      <RuiTextField
        id="postal"
        data-cy="postal"
        :model-value="modelValue.postcode"
        color="primary"
        autocomplete="postal-code"
        dense
        :label="t('auth.signup.address.form.postal_code')"
        :error-messages="errors('postcode')"
        @update:model-value="updateValue('postcode', $event)"
        @blur="touch('postcode')"
      />

      <CountrySelect
        :model-value="modelValue.country"
        :error-messages="errors('country')"
        dense
        @blur="touch('country')"
        @update:model-value="updateValue('country', $event)"
      />
      <Recaptcha
        id="signup-captcha"
        :invalid="hasError('captcha')"
        @error="onError()"
        @expired="onExpired()"
        @success="onSuccess($event)"
        @update:captcha-id="setCaptchaId($event)"
      />

      <div class="text-pretty">
        <RuiCheckbox
          id="tos"
          v-model="terms"
          color="primary"
          details="auto"
          :error-messages="errors('terms')"
        >
          <i18n-t
            keypath="auth.signup.address.form.tos"
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
          {{ t('auth.signup.address.form.newsletter_consent') }}
          <span class="block text-caption text-rui-text-secondary mt-1">
            {{ t('auth.signup.address.form.newsletter_consent_hint') }}
          </span>
        </RuiCheckbox>
      </div>
    </div>
  </div>
  <div class="mt-8 flex gap-3">
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
      :disabled="loading"
      color="primary"
      class="flex-1"
      size="lg"
      :loading="loading"
      @click="finish()"
    >
      {{ t('auth.signup.create_account') }}
    </RuiButton>
  </div>
</template>
