<script setup lang="ts">
import { get } from '@vueuse/shared';
import { z } from 'zod';
import ButtonLink from '~/components/common/ButtonLink.vue';
import FormErrorsAlert from '~/components/common/FormErrorsAlert.vue';
import { ADDRESS_FIELDS, useProfileUpdate } from '~/composables/account/use-profile-update';
import { useVatVerification } from '~/composables/account/use-vat-verification';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';
import { VatIdStatus } from '~/types/account';
import { formatSeconds } from '~/utils/text';

const emit = defineEmits<{
  'saved': [];
  'cancel': [];
  'edit-address': [];
}>();

const { t } = useI18n({ useScope: 'global' });

interface ProfileFormState {
  companyName: string;
  firstName: string;
  lastName: string;
  vatId: string;
}

const state = reactive<ProfileFormState>({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
});

const [DefineVAT, ReuseVAT] = createReusableTemplate();
const [DefineEditAddressButton, EditAddressButton] = createReusableTemplate<{ label: string }>();

const {
  account,
  loading,
  movedOffline,
  updateProfile,
} = useProfileUpdate();

const { required } = useFormRules();

// An account that moved offline keeps no name here, so the name fields are optional then.
const form = useZodForm(() => {
  const name = get(movedOffline) ? z.string() : required();
  return z.object({
    firstName: name,
    lastName: name,
    companyName: z.string(),
    vatId: z.string(),
  });
}, state);
const { errors, formErrorFields, formErrors, invalid, touch } = form;

const {
  checking: loadingCheck,
  errorMessage: vatErrorMessage,
  remainingTime,
  successMessage: vatSuccessMessage,
  verify: handleCheckVATClick,
} = useVatVerification(async () => updateProfile(form, state));

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();

/** The backend checks the saved address on every profile save, so it has to come first. */
const addressMissing = computed<boolean>(() => {
  const address = get(account)?.address;
  return !address || !address.address1 || !address.city || !address.postcode;
});

/** The save failed on the stored address, which only the address form can fix. */
const addressRejected = computed<boolean>(() => get(formErrorFields).some(field => ADDRESS_FIELDS.includes(field)));

const isVatIdValid = computed<boolean>(() => get(account)?.vatIdStatus === VatIdStatus.VALID || false);

const vatHint = computed<string>(() => {
  const wait = get(remainingTime);
  if (wait > 0) {
    const formatted = formatSeconds(wait);
    const time = `${(formatted.minutes || '00').toString().padStart(2, '0')}:${(formatted.seconds || '00').toString().padStart(2, '0')}`;
    return t('auth.signup.vat.timer', { time });
  }

  return t('auth.signup.customer_information.form.vat_id_hint');
});

const hideVATVerifyButton = computed<boolean>(() => {
  const status = get(account)?.vatIdStatus;
  return status === VatIdStatus.NON_EU_ID;
});

const vatStatusErrorMessage = computed<string>(() => {
  if (get(remainingTime) > 0 || state.vatId === '')
    return '';
  const status = get(account)?.vatIdStatus;
  if (status === VatIdStatus.NOT_VALID) {
    return t('auth.signup.vat.invalid');
  }
  else if (status === VatIdStatus.NOT_CHECKED) {
    return t('auth.signup.vat.not_verified');
  }
  return '';
});

function reset(): void {
  const userAccount = get(account);

  if (!userAccount)
    return;

  const unavailable = get(movedOffline);

  state.vatId = userAccount.address.vatId;

  if (unavailable)
    return;

  state.firstName = userAccount.address.firstName;
  state.lastName = userAccount.address.lastName;
  state.companyName = userAccount.address.companyName;

  form.reset();
}

async function update(): Promise<void> {
  if (await updateProfile(form, state))
    emit('saved');
}

/** Enter in the VAT ID field runs the check next to it instead of submitting the whole form. */
async function verifyOnEnter(): Promise<void> {
  if (get(hideVATVerifyButton) || get(remainingTime) > 0 || !state.vatId || get(loadingCheck))
    return;
  await handleCheckVATClick();
}

// Saving the address in the other form fixes what this form's last error was about
watch(() => get(account)?.address, () => {
  if (get(formErrors).length > 0)
    form.reset();
});

onMounted(() => {
  reset();
});
</script>

<template>
  <DefineEditAddressButton #default="{ label }">
    <RuiButton
      class="mt-2 -ms-2"
      size="sm"
      variant="text"
      color="primary"
      @click="emit('edit-address')"
    >
      {{ label }}
    </RuiButton>
  </DefineEditAddressButton>
  <DefineVAT>
    <div class="flex gap-4 items-start">
      <RuiTextField
        id="vat-id"
        v-model="state.vatId"
        color="primary"
        dense
        class="flex-1"
        :label="t('auth.signup.customer_information.form.vat_id')"
        :hint="vatHint"
        :error-messages="[...errors('vatId'), vatStatusErrorMessage, vatErrorMessage]"
        :success-messages="vatSuccessMessage"
        @blur="touch('vatId')"
        @keydown.enter.prevent="verifyOnEnter()"
      >
        <template #append>
          <RuiIcon
            v-if="!hideVATVerifyButton && state.vatId"
            size="16"
            :name="isVatIdValid ? 'lu-circle-check' : 'lu-circle-x'"
            :color="isVatIdValid ? 'success' : 'error'"
          />
        </template>
      </RuiTextField>
      <RuiButton
        v-if="!hideVATVerifyButton"
        color="primary"
        class="mt-6 h-8"
        :disabled="remainingTime > 0 || !state.vatId"
        :loading="loadingCheck"
        @click="handleCheckVATClick()"
      >
        {{ t('auth.signup.vat.verify') }}
      </RuiButton>
    </div>
  </DefineVAT>
  <form
    v-if="!movedOffline"
    class="max-w-2xl"
    @submit.prevent="update()"
  >
    <RuiAlert
      v-if="addressMissing"
      type="info"
      class="mb-6"
    >
      {{ t('account.billing.invoice.address_first') }}
      <EditAddressButton :label="t('account.billing.invoice.add_address')" />
    </RuiAlert>
    <div class="space-y-5">
      <RuiTextField
        id="first-name"
        v-model="state.firstName"
        color="primary"
        dense
        autocomplete="given-name"
        :label="t('auth.signup.customer_information.form.first_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="errors('firstName')"
        @blur="touch('firstName')"
      />

      <RuiTextField
        id="last-name"
        v-model="state.lastName"
        color="primary"
        dense
        autocomplete="family-name"
        :label="t('auth.signup.customer_information.form.last_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="errors('lastName')"
        @blur="touch('lastName')"
      />

      <RuiTextField
        id="company-name"
        v-model="state.companyName"
        color="primary"
        dense
        autocomplete="organization"
        :label="t('auth.signup.customer_information.form.company')"
        :hint="t('auth.signup.customer_information.form.company_hint')"
        :error-messages="errors('companyName')"
        @blur="touch('companyName')"
      />

      <ReuseVAT />
    </div>

    <FormErrorsAlert
      class="mt-6"
      :messages="formErrors"
      :title="addressRejected ? t('account.billing.invoice.check_address') : undefined"
    >
      <EditAddressButton
        v-if="addressRejected"
        :label="t('account.billing.invoice.edit_address')"
      />
    </FormErrorsAlert>

    <div class="mt-8 flex flex-wrap gap-3">
      <RuiButton
        type="submit"
        data-testid="update-profile"
        :disabled="invalid"
        :loading="loading"
        color="primary"
      >
        {{ t('actions.save') }}
      </RuiButton>
      <RuiButton
        variant="text"
        color="primary"
        @click="emit('cancel')"
      >
        {{ t('actions.cancel') }}
      </RuiButton>
    </div>
  </form>
  <RuiAlert
    v-else
    type="info"
    class="max-w-2xl"
  >
    <i18n-t
      keypath="account.moved_offline"
      scope="global"
    >
      <template #email>
        <ButtonLink
          inline
          color="primary"
          :to="supportEmailMailto"
          class="underline"
          external
        >
          {{ supportEmail }}
        </ButtonLink>
      </template>
    </i18n-t>
  </RuiAlert>

  <div
    v-if="movedOffline"
    class="mt-4 max-w-2xl"
  >
    <ReuseVAT />
  </div>
</template>
