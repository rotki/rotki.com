<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useProfileUpdate } from '~/composables/account/use-profile-update';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';
import { useVatCheck } from '~/modules/checkout/composables/use-vat-check';
import { VatIdStatus } from '~/types/account';
import { formatSeconds } from '~/utils/text';

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

const vatSuccessMessage = ref<string>('');
const vatErrorMessage = ref<string>('');
const loadingCheck = ref<boolean>(false);
const remainingTime = ref<number>(0);

const waitUntilTime = useLocalStorage<number>('rotki.vat_check.wait_until_time', 0);

const [DefineVAT, ReuseVAT] = createReusableTemplate();
const { refreshVATCheckStatus, checkVAT } = useVatCheck();

const {
  account,
  dismissDone,
  done,
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
const { errors, invalid, touch } = form;

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
  await updateProfile(form, state);
}

/** Enter in the VAT ID field runs the check next to it instead of submitting the whole form. */
async function verifyOnEnter(): Promise<void> {
  if (get(hideVATVerifyButton) || get(remainingTime) > 0 || !state.vatId || get(loadingCheck))
    return;
  await handleCheckVATClick();
}

async function handleCheckVATClick() {
  set(loadingCheck, true);
  await updateProfile(form, state);
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

    <div class="mt-8 flex flex-wrap gap-3">
      <RuiButton
        type="submit"
        data-cy="update-profile"
        :disabled="invalid"
        :loading="loading"
        color="primary"
      >
        {{ t('actions.save') }}
      </RuiButton>
      <RuiButton
        variant="text"
        color="primary"
        @click="reset()"
      >
        {{ t('actions.reset') }}
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

  <FloatingNotification
    type="success"
    closeable
    :visible="done"
    :timeout="3000"
    @dismiss="dismissDone()"
  >
    {{ t('notifications.changes_saved') }}
  </FloatingNotification>
</template>
