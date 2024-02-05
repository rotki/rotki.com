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

  state.firstName = userAccount.address.firstName;
  state.lastName = userAccount.address.lastName;
  state.companyName = userAccount.address.companyName;
  state.vatId = userAccount.address.vatId;

  get(v$).$reset();
}

async function update() {
  const userAccount = get(account);
  if (!userAccount)
    return;

  const isValid = await get(v$).$validate();
  if (!isValid)
    return;

  set(loading, true);

  const payload = objectOmit(
    {
      ...userAccount.address,
      ...state,
    },
    ['movedOffline'],
  );
  const { success, message } = await store.updateProfile(payload);
  if (success)
    set(done, true);
  else if (message && typeof message !== 'string')
    set($externalResults, message);

  set(loading, false);
}

const { t } = useI18n();
</script>

<template>
  <div
    v-if="!movedOffline"
    class="pt-2"
  >
    <div class="space-y-5">
      <RuiTextField
        id="first-name"
        v-model="state.firstName"
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
      <RuiButton
        size="lg"
        color="primary"
        variant="outlined"
        @click="reset()"
      >
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
  <RuiAlert
    v-else
    type="info"
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
