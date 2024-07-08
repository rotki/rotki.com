<script lang="ts" setup>
import { helpers, required } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { useVuelidate } from '@vuelidate/core';
import { toMessages } from '~/utils/validation';
import type { SignupAddressPayload } from '~/types/signup';
import type { ValidationErrors } from '~/types/common';

const props = defineProps<{
  modelValue: SignupAddressPayload;
  externalResults: ValidationErrors;
  captchaId: number | undefined;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (
    e: 'finish',
    events: {
      recaptchaToken: string;
      onExpired: () => void;
    },
  ): void;
  (e: 'update:model-value', newValue: SignupAddressPayload): void;
  (e: 'update:captcha-id', captchaId: number): void;
}>();

const { modelValue, externalResults } = toRefs(props);

const rules = {
  address1: { required },
  address2: {},
  city: { required },
  postcode: {
    required,
    validateCode: helpers.withMessage(
      'Enter a valid postal code. Only alphabets, numbers, space and -',
      helpers.regex(/^[\d\sA-Za-z-]+$/),
    ),
  },
  country: { required },
  captcha: { required },
  terms: { checked: (value: boolean) => value },
};

const terms = ref<boolean>(false);

const recaptcha = useRecaptcha();
const { recaptchaPassed, onError, onSuccess, onExpired, recaptchaToken }
  = recaptcha;

const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(
  rules,
  computed(() => ({
    ...get(modelValue),
    captcha: recaptchaToken,
    terms,
  })),
  {
    $autoDirty: true,
    $externalResults,
  },
);

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

function setCaptchaId(captchaId: number) {
  emit('update:captcha-id', captchaId);
}

function finish() {
  emit('finish', {
    recaptchaToken: get(recaptchaToken),
    onExpired,
  });
}

const { t } = useI18n();
</script>

<template>
  <div class="space-y-8 grow">
    <div class="text-h4 text-center">
      Address
    </div>
    <div class="space-y-5">
      <RuiTextField
        id="address-1"
        maxlength="128"
        :model-value="modelValue.address1"
        variant="outlined"
        color="primary"
        autocomplete="address-line1"
        dense
        :label="t('auth.signup.address.form.address_line_1')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.address1)"
        @update:model-value="updateValue('address1', $event)"
        @blur="v$.address1.$touch()"
      />
      <RuiTextField
        id="address-2"
        maxlength="128"
        :model-value="modelValue.address2"
        variant="outlined"
        color="primary"
        autocomplete="address-line2"
        dense
        :label="t('auth.signup.address.form.address_line_2')"
        :hint="t('auth.common.optional')"
        :error-messages="toMessages(v$.address2)"
        @update:model-value="updateValue('address2', $event)"
        @blur="v$.address2.$touch()"
      />
      <RuiTextField
        id="city"
        :model-value="modelValue.city"
        variant="outlined"
        color="primary"
        autocomplete="address-level2"
        dense
        :label="t('auth.signup.address.form.city')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.city)"
        @update:model-value="updateValue('city', $event)"
        @blur="v$.city.$touch()"
      />
      <RuiTextField
        id="postal"
        data-cy="postal"
        :model-value="modelValue.postcode"
        variant="outlined"
        color="primary"
        autocomplete="postal-code"
        dense
        :label="t('auth.signup.address.form.postal_code')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.postcode)"
        @update:model-value="updateValue('postcode', $event)"
        @blur="v$.postcode.$touch()"
      />

      <CountrySelect
        :model-value="modelValue.country"
        :error-messages="toMessages(v$.country)"
        dense
        :hint="t('auth.common.required')"
        @blur="v$.country.$touch()"
        @update:model-value="updateValue('country', $event)"
      />
      <Recaptcha
        id="signup-captcha"
        :invalid="v$.captcha.$invalid && v$.captcha.$dirty"
        @error="onError()"
        @expired="onExpired()"
        @success="onSuccess($event)"
        @update:captcha-id="setCaptchaId($event)"
      />

      <RuiCheckbox
        id="tos"
        v-model="terms"
        color="primary"
      >
        <i18n-t
          keypath="auth.signup.address.form.tos"
          scope="global"
        >
          <template #tos>
            <ButtonLink
              to="/tos"
              inline
              color="primary"
              external
            >
              {{ t('footer_legalese.tos') }}
            </ButtonLink>
          </template>
          <template #privacy_policy>
            <ButtonLink
              to="/privacy-policy"
              inline
              color="primary"
              external
            >
              {{ t('footer_legalese.privacy_policy') }}
            </ButtonLink>
          </template>
        </i18n-t>
      </RuiCheckbox>
    </div>
  </div>
  <div class="mt-16 grid md:grid-cols-2 gap-4">
    <RuiButton
      data-cy="back-button"
      type="button"
      class="w-full row-start-2 md:row-start-auto"
      size="lg"
      @click="emit('back')"
    >
      {{ t('actions.back') }}
    </RuiButton>
    <RuiButton
      data-cy="submit-button"
      :disabled="v$.$invalid || !recaptchaPassed || loading"
      color="primary"
      class="w-full"
      size="lg"
      :loading="loading"
      @click="finish()"
    >
      {{ t('auth.signup.create_account') }}
    </RuiButton>
  </div>
</template>
