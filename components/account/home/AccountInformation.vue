<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { get, objectOmit, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const state = reactive({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
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
  firstName: { required },
  lastName: { required },
  companyName: {},
  vatId: {},
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

  state.firstName = unavailable ? offline : userAccount.address.firstName;
  state.lastName = unavailable ? offline : userAccount.address.lastName;
  state.companyName = unavailable ? offline : userAccount.address.companyName;
  state.vatId = unavailable ? offline : userAccount.address.vatId;

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
      githubUsername: userAccount.githubUsername,
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
        id="first-name"
        v-model="state.firstName"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="given-name"
        :label="t('auth.signup.customer_information.form.first_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="toMessages(v$.firstName)"
        @blur="v$.firstName.$touch()"
      />

      <RuiTextField
        id="last-name"
        v-model="state.lastName"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="family-name"
        :label="t('auth.signup.customer_information.form.last_name')"
        :hint="t('auth.signup.customer_information.form.name_hint')"
        :error-messages="toMessages(v$.lastName)"
        @blur="v$.lastName.$touch()"
      />

      <RuiTextField
        id="company-name"
        v-model="state.companyName"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        autocomplete="organization"
        :label="t('auth.signup.customer_information.form.company')"
        :hint="t('auth.signup.customer_information.form.company_hint')"
        :error-messages="toMessages(v$.companyName)"
        @blur="v$.companyName.$touch()"
      />

      <RuiTextField
        id="vat-id"
        v-model="state.vatId"
        :disabled="movedOffline"
        variant="outlined"
        color="primary"
        :label="t('auth.signup.customer_information.form.vat_id')"
        :hint="t('auth.signup.customer_information.form.vat_id_hint')"
        :error-messages="toMessages(v$.vatId)"
        @blur="v$.vatId.$touch()"
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
