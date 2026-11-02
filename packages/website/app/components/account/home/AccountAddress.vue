<script setup lang="ts">
import { get } from '@vueuse/shared';
import { z } from 'zod';
import CountrySelect from '~/components/account/CountrySelect.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import FormErrorsAlert from '~/components/common/FormErrorsAlert.vue';
import { NAME_FIELDS, useProfileUpdate } from '~/composables/account/use-profile-update';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';

const emit = defineEmits<{
  'saved': [];
  'cancel': [];
  'edit-name': [];
}>();

const state = reactive({
  address1: '',
  address2: '',
  city: '',
  postcode: '',
  country: '',
});

const {
  account,
  loading,
  movedOffline,
  updateProfile,
} = useProfileUpdate();

const { postcode, required } = useFormRules();

const form = useZodForm(z.object({
  address1: required(),
  address2: z.string(),
  city: required(),
  postcode: postcode(),
  country: required(),
}), state);
const { errors, formErrorFields, formErrors, invalid, touch } = form;

/** The save failed on the stored name or VAT ID, which only the other form can fix. */
const nameRejected = computed<boolean>(() => get(formErrorFields).some(field => NAME_FIELDS.includes(field)));

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();

function reset() {
  const userAccount = get(account);

  if (!userAccount)
    return;

  const unavailable = get(movedOffline);

  if (unavailable)
    return;

  state.address1 = userAccount.address.address1;
  state.address2 = userAccount.address.address2;
  state.city = userAccount.address.city;
  state.postcode = userAccount.address.postcode;
  state.country = userAccount.address.country;

  form.reset();
}

async function update(): Promise<void> {
  if (await updateProfile(form, state))
    emit('saved');
}

onBeforeMount(() => {
  reset();
});

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <form
    v-if="!movedOffline"
    class="max-w-2xl"
    @submit.prevent="update()"
  >
    <div class="space-y-5">
      <RuiTextField
        id="address-1"
        v-model="state.address1"
        maxlength="128"
        color="primary"
        dense
        autocomplete="address-line1"
        :label="t('auth.signup.address.form.address_line_1')"
        :hint="t('auth.common.required')"
        :error-messages="errors('address1')"
        @blur="touch('address1')"
      />

      <RuiTextField
        id="address-2"
        v-model="state.address2"
        maxlength="128"
        color="primary"
        dense
        autocomplete="address-line2"
        :label="t('auth.signup.address.form.address_line_2')"
        :hint="t('auth.common.optional')"
        :error-messages="errors('address2')"
        @blur="touch('address2')"
      />

      <RuiTextField
        id="city"
        v-model="state.city"
        color="primary"
        dense
        autocomplete="address-level2"
        :label="t('auth.signup.address.form.city')"
        :hint="t('auth.common.required')"
        :error-messages="errors('city')"
        @blur="touch('city')"
      />

      <RuiTextField
        id="postal"
        v-model="state.postcode"
        color="primary"
        dense
        autocomplete="postal-code"
        :label="t('auth.signup.address.form.postal_code')"
        :hint="t('auth.common.required')"
        :error-messages="errors('postcode')"
        @blur="touch('postcode')"
      />

      <CountrySelect
        v-model="state.country"
        disabled
        dense
        :error-messages="errors('country')"
        :hint="t('account.address.country.hint', { email: supportEmail })"
        @blur="touch('country')"
      />
    </div>

    <FormErrorsAlert
      class="mt-6"
      :messages="formErrors"
      :title="nameRejected ? t('account.billing.invoice.check_name') : undefined"
    >
      <RuiButton
        v-if="nameRejected"
        class="mt-2 -ms-2"
        size="sm"
        variant="text"
        color="primary"
        @click="emit('edit-name')"
      >
        {{ t('account.billing.invoice.edit_name') }}
      </RuiButton>
    </FormErrorsAlert>

    <div class="mt-8 flex flex-wrap gap-3">
      <RuiButton
        type="submit"
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
</template>
