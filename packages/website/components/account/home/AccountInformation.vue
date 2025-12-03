<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { requiredUnless } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import { useProfileUpdate } from '~/composables/use-profile-update';
import { useVatCheck } from '~/composables/use-vat-check';
import { VatIdStatus } from '~/types/account';
import { formatSeconds } from '~/utils/text';
import { toMessages } from '~/utils/validation';

const { t } = useI18n({ useScope: 'global' });

const state = reactive({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
});

const vatSuccessMessage = ref<string>('');
const vatErrorMessage = ref<string>('');
const loadingCheck = ref<boolean>(false);
const remainingTime = ref<number>(0);

const waitUntilTime = useLocalStorage<number>('rotki.vat_check.wait_until_time', 0);

const [DefineVAT, ReuseVAT] = createReusableTemplate();
const { refreshVATCheckStatus, checkVAT } = useVatCheck();

const {
  $externalResults,
  account,
  done,
  loading,
  movedOffline,
  updateProfile,
} = useProfileUpdate();

const rules = {
  firstName: { required: requiredUnless(movedOffline) },
  lastName: { required: requiredUnless(movedOffline) },
  companyName: {},
  vatId: {},
};

const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});

const { pause: pauseTimer, resume } = useIntervalFn(() => {
  if (!updateRemainingTime()) {
    set(remainingTime, 0);
    pauseTimer();
  }
}, 1000, { immediate: false });

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();

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
  await updateProfile(v$, state);
}

async function handleCheckVATClick() {
  set(loadingCheck, true);
  await updateProfile(v$, state);
  const checkResult = await checkVAT();
  await refreshVATCheckStatus();

  if ('seconds' in checkResult) {
    const now = Math.round(Date.now() / 1000);
    set(waitUntilTime, now + checkResult.seconds);
    set(remainingTime, checkResult.seconds);
    pauseTimer();
    if (checkResult.seconds > 0) {
      resume();
    }
  }
  else if (checkResult.success) {
    const status = get(account)?.vatIdStatus;
    if (status === VatIdStatus.VALID) {
      set(vatSuccessMessage, t('auth.signup.vat.verified'));
      setTimeout(() => {
        set(vatSuccessMessage, '');
      }, 3000);
    }
  }
  else {
    set(vatErrorMessage, checkResult.message);
    setTimeout(() => {
      set(vatErrorMessage, '');
    }, 3000);
  }
  set(loadingCheck, false);
}

function updateRemainingTime(): boolean {
  const now = Math.round(Date.now() / 1000);
  const endTime = get(waitUntilTime);

  if (endTime && endTime > now) {
    set(remainingTime, endTime - now);
    return true;
  }
  return false;
}

onMounted(() => {
  reset();
  resume();
  updateRemainingTime();
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
        :error-messages="[...toMessages(v$.vatId), vatStatusErrorMessage, vatErrorMessage]"
        :success-messages="vatSuccessMessage"
        @blur="v$.vatId.$touch()"
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
        class="h-10"
        :disabled="remainingTime > 0 || !state.vatId"
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
