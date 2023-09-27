<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { get, objectOmit, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const state = reactive({
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

onBeforeMount(() => {
  reset();
});

const rules = {
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

const {
  public: {
    contact: { supportEmail },
  },
} = useRuntimeConfig();

const reset = () => {
  const userAccount = get(account);

  if (!userAccount) {
    return;
  }

  const offline = t('account.moved_offline', { email: supportEmail });
  const unavailable = get(movedOffline);

  state.address1 = unavailable ? offline : userAccount.address.address1;
  state.address2 = unavailable ? offline : userAccount.address.address2;
  state.city = unavailable ? offline : userAccount.address.city;
  state.postcode = unavailable ? offline : userAccount.address.postcode;
  state.country = unavailable ? offline : userAccount.address.country;

  get(v$).$reset();
};

const update = async () => {
  const userAccount = get(account);
  if (!userAccount) {
    return;
  }

  const isValid = await get(v$).$validate();
  if (!isValid) {
    return;
  }
  set(loading, true);

  const payload = objectOmit(
    {
      ...userAccount.address,
      ...state,
    },
    ['movedOffline'],
  );
  const { success, message } = await store.updateProfile(payload);
  if (success) {
    set(done, true);
  } else if (message && typeof message !== 'string') {
    set($externalResults, message);
  }
  set(loading, false);
};

const { t } = useI18n();
</script>

<template>
  <div class="pt-2">
    <div class="space-y-5">
      <RuiTextField
        id="address-1"
        v-model="state.address1"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="address-line1"
        :label="t('auth.signup.address.form.address_line_1')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.address1)"
        @blur="v$.address1.$touch()"
      />

      <RuiTextField
        id="address-2"
        v-model="state.address2"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="address-line2"
        :label="t('auth.signup.address.form.address_line_2')"
        :hint="t('auth.common.optional')"
        :error-messages="toMessages(v$.address2)"
        @blur="v$.address2.$touch()"
      />

      <RuiTextField
        id="city"
        v-model="state.city"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="address-level2"
        :label="t('auth.signup.address.form.city')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.city)"
        @blur="v$.city.$touch()"
      />

      <RuiTextField
        id="postal"
        v-model="state.postcode"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="postal-code"
        :label="t('auth.signup.address.form.postal_code')"
        :hint="t('auth.common.required')"
        :error-messages="toMessages(v$.postcode)"
        @blur="v$.postcode.$touch()"
      />

      <CountrySelect
        v-model="state.country"
        disabled
        :error-messages="toMessages(v$.country)"
        :hint="t('account.address.country.hint', { email: supportEmail })"
        @blur="v$.country.$touch()"
      />
    </div>

    <div class="mt-10 mb-5 border-t border-grey-50" />

    <div class="flex justify-end gap-3">
      <RuiButton size="lg" color="primary" variant="outlined" @click="reset()">
        {{ t('actions.reset') }}
      </RuiButton>
      <RuiButton
        :disabled="v$.$invalid"
        size="lg"
        :loading="loading"
        color="primary"
        @click="update()"
      >
        {{ t('actions.update') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    type="success"
    closeable
    :visible="done"
    :timeout="3000"
    @dismiss="done = false"
  >
    {{ t('notifications.changes_saved') }}
  </FloatingNotification>
</template>
