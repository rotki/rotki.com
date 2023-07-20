<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const state = reactive({
  githubUsername: '',
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
  address1: '',
  address2: '',
  city: '',
  postcode: '',
  country: '',
});

const loading = ref(false);
const done = ref(false);

const { account } = storeToRefs(store);

const movedOffline = computed(
  () => get(account)?.address.movedOffline ?? false,
);

onMounted(() => {
  const userAccount = get(account);
  if (!userAccount) {
    return;
  }

  const offline =
    'Moved offline. For editing please contact support@rotki.com.';

  const unavailable = get(movedOffline);

  state.githubUsername = userAccount.githubUsername;
  state.firstName = unavailable ? offline : userAccount.address.firstName;
  state.lastName = unavailable ? offline : userAccount.address.lastName;
  state.companyName = unavailable ? offline : userAccount.address.companyName;
  state.vatId = unavailable ? offline : userAccount.address.vatId;
  state.address1 = unavailable ? offline : userAccount.address.address1;
  state.address2 = unavailable ? offline : userAccount.address.address2;
  state.city = unavailable ? offline : userAccount.address.city;
  state.postcode = unavailable ? offline : userAccount.address.postcode;
  state.country = unavailable ? offline : userAccount.address.country;
});

const rules = {
  githubUsername: {},
  firstName: { required },
  lastName: { required },
  companyName: {},
  vatId: {},
  address1: { required },
  address2: {},
  city: { required },
  postcode: { required },
  country: { required },
};

const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});

const update = async () => {
  const isValid = await get(v$).$validate();
  if (!isValid) {
    return;
  }
  set(loading, true);
  const { success, message } = await store.updateProfile(state);
  if (success) {
    set(done, true);
  } else if (message && typeof message !== 'string') {
    set($externalResults, message);
  }
  set(loading, false);
};

const { countries } = useCountries();
const css = useCssModule();
</script>

<template>
  <CardContainer :class="css.info">
    <TextHeading subheading> Customer Information</TextHeading>
    <InputField
      id="github"
      v-model="state.githubUsername"
      :error-messages="v$.githubUsername.$errors"
      hint="Optional. Provide Github username for in-Github support."
      label="Github Username"
      @blur="v$.githubUsername.$touch()"
    />

    <InputField
      id="first-name"
      v-model="state.firstName"
      :disabled="movedOffline"
      :error-messages="v$.firstName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="First Name"
      autocomplete="given-name"
      @blur="v$.firstName.$touch()"
    />

    <InputField
      id="last-name"
      v-model="state.lastName"
      :disabled="movedOffline"
      :error-messages="v$.lastName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Last Name"
      autocomplete="family-name"
      @blur="v$.lastName.$touch()"
    />

    <InputField
      id="company-name"
      v-model="state.companyName"
      :disabled="movedOffline"
      :error-messages="v$.companyName.$errors"
      hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
      label="Company Name"
      autocomplete="organization"
      @blur="v$.companyName.$touch()"
    />

    <InputField
      id="vat-id"
      v-model="state.vatId"
      :disabled="movedOffline"
      :error-messages="v$.vatId.$errors"
      hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
      label="VAT ID"
      @blur="v$.vatId.$touch()"
    />

    <TextHeading subheading>Address</TextHeading>

    <InputField
      id="address-1"
      v-model="state.address1"
      :disabled="movedOffline"
      :error-messages="v$.address1.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Address line 1"
      autocomplete="address-line1"
      @blur="v$.address1.$touch()"
    />

    <InputField
      id="address-2"
      v-model="state.address2"
      :disabled="movedOffline"
      :error-messages="v$.address2.$errors"
      hint="Optional. Additional data for the address."
      label="Address line 2"
      autocomplete="address-line2"
      @blur="v$.address2.$touch()"
    />

    <InputField
      id="city"
      v-model="state.city"
      :disabled="movedOffline"
      :error-messages="v$.city.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="City"
      autocomplete="address-level2"
      @blur="v$.city.$touch()"
    />

    <InputField
      id="postal"
      v-model="state.postcode"
      :disabled="movedOffline"
      :error-messages="v$.postcode.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Postal code"
      autocomplete="postal-code"
      @blur="v$.postcode.$touch()"
    />

    <CountrySelect
      id="country"
      v-model="state.country"
      :countries="countries"
      disabled
      :error-messages="v$.country.$errors"
      hint="Email us at support@rotki.com if you need to change your billing country."
      label="Country"
      autocomplete="country"
      @blur="v$.country.$touch()"
    />

    <div class="my-5 border-t border-grey-50" />

    <div class="flex justify-end mt-8">
      <RuiButton size="lg" :loading="loading" color="primary" @click="update()">
        Update
      </RuiButton>
    </div>
  </CardContainer>
</template>

<style lang="scss" module>
.info {
  @apply mt-8;
}
</style>
