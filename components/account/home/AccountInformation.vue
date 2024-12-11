<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { get, objectOmit, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { toMessages } from '~/utils/validation';
import { VatIdStatus } from '~/types/account';
import { formatSeconds } from '~/utils/text';

const { t } = useI18n();

const store = useMainStore();
const state = reactive({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
});

const loading = ref(false);
const done = ref(false);
const vatSuccessMessage = ref('');

const { account } = storeToRefs(store);

const movedOffline = computed(
  () => get(account)?.address.movedOffline ?? false,
);

const isVatIdValid = computed(
  () => get(account)?.vatIdStatus === VatIdStatus.VALID || false,
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

  state.vatId = userAccount.address.vatId;

  if (unavailable)
    return;

  state.firstName = userAccount.address.firstName;
  state.lastName = userAccount.address.lastName;
  state.companyName = userAccount.address.companyName;

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

const waitTime = ref<number>(0);
const loadingCheck = ref<boolean>(false);

const { pause: pauseTimer, resume } = useIntervalFn(() => {
  const wait = get(waitTime);
  if (wait > 0) {
    set(waitTime, wait - 1);
  }
  else {
    pauseTimer();
  }
}, 1000, { immediate: false });

async function handleCheckVATClick() {
  set(loadingCheck, true);
  const result = await store.checkVAT();
  await store.refreshVATCheckStatus();

  if (typeof result === 'number') {
    set(waitTime, result);
    pauseTimer();
    if (result > 0) {
      resume();
    }
  }
  else if (result) {
    set(vatSuccessMessage, t('auth.signup.vat.verified'));
    setTimeout(() => {
      set(vatSuccessMessage, '');
    }, 3000);
  }
  set(loadingCheck, false);
}

const [DefineVAT, ReuseVAT] = createReusableTemplate();

const vatHint = computed(() => {
  const wait = get(waitTime);
  if (wait > 0) {
    const formatted = formatSeconds(wait);
    const time = `${(formatted.minutes || '00').toString().padStart(2, '0')}:${(formatted.seconds || '00').toString().padStart(2, '0')}`;
    return t('auth.signup.vat.timer', { time });
  }

  return t('auth.signup.customer_information.form.vat_id_hint');
});

const hideVATVerifyButton = computed(() => {
  const status = get(account)?.vatIdStatus;
  return status === VatIdStatus.NON_EU_ID;
});

const vatErrorMessage = computed(() => {
  if (get(waitTime) > 0)
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
</script>

<template>
  <DefineVAT>
    <div class="flex gap-4 items-start">
      <RuiTextField
        id="vat-id"
        v-model="state.vatId"
        variant="outlined"
        color="primary"
        dense
        class="flex-1"
        :label="t('auth.signup.customer_information.form.vat_id')"
        :hint="vatHint"
        :error-messages="[...toMessages(v$.vatId), vatErrorMessage]"
        :success-messages="vatSuccessMessage"
        @blur="v$.vatId.$touch()"
      >
        <template #append>
          <RuiIcon
            v-if="!hideVATVerifyButton"
            size="16"
            :name="isVatIdValid ? 'lu-circle-check' : 'lu-circle-x'"
            :color="isVatIdValid ? 'success' : 'error'"
          />
        </template>
      </RuiTextField>
      <RuiButton
        v-if="!hideVATVerifyButton"
        color="primary"
        class="h-10"
        :disabled="waitTime > 0"
        :loading="loadingCheck"
        @click="handleCheckVATClick()"
      >
        {{ t('auth.signup.vat.verify') }}
      </RuiButton>
    </div>
  </DefineVAT>
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
        dense
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
        dense
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
        dense
        autocomplete="organization"
        :label="t('auth.signup.customer_information.form.company')"
        :hint="t('auth.signup.customer_information.form.company_hint')"
        :error-messages="toMessages(v$.companyName)"
        @blur="v$.companyName.$touch()"
      />

      <ReuseVAT />
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

  <div
    v-if="movedOffline"
    class="mt-4"
  >
    <ReuseVAT />
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
