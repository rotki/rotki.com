<script setup lang="ts">
import type { ActionResult } from '~/types/common';
import { useVuelidate } from '@vuelidate/core';
import { minLength, required, sameAs } from '@vuelidate/validators';
import { get, set } from '@vueuse/core';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useAccountApi } from '~/composables/account/use-account-api';
import { toMessages } from '~/utils/validation';

const loading = ref(false);
const success = ref(false);

const accountApi = useAccountApi();

const state = reactive({
  currentPassword: '',
  newPassword: '',
  passwordConfirmation: '',
});

const { newPassword } = toRefs(state);

const rules = {
  currentPassword: { required, minLength: minLength(8) },
  newPassword: { required, minLength: minLength(8) },
  passwordConfirmation: {
    required,
    sameAsPassword: sameAs(newPassword, 'new password'),
  },
};
const $externalResults = ref({});
const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});

let pendingTimeout: any;

async function changePassword() {
  set(loading, true);
  const result: ActionResult = await accountApi.changePassword(state);
  set(loading, false);
  if (result.message && typeof result.message !== 'string')
    set($externalResults, result.message);

  if (result.success) {
    set(success, true);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = undefined;
    }
    pendingTimeout = setTimeout(() => {
      set(success, false);
    }, 4000);
    reset();
  }
}

function reset() {
  state.currentPassword = '';
  state.newPassword = '';
  state.passwordConfirmation = '';
  get(v$).$reset();
}

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.change_password.title') }}
    </div>
    <div>
      <div class="space-y-5">
        <RuiRevealableTextField
          id="current-password"
          v-model="state.currentPassword"
          variant="outlined"
          color="primary"
          dense
          :error-messages="toMessages(v$.currentPassword)"
          :hint="t('account.change_password.current_password.hint')"
          :label="t('account.change_password.current_password.label')"
          autocomplete="current-password"
        />

        <div class="space-y-1">
          <RuiRevealableTextField
            id="new-password"
            v-model="state.newPassword"
            color="primary"
            variant="outlined"
            dense
            hide-details
            :label="t('account.change_password.new_password.label')"
            autocomplete="new-password"
            :error-messages="toMessages(v$.newPassword).length > 0 ? [''] : []"
          />

          <ul
            class="ml-4 list-disc text-caption"
            :class="
              toMessages(v$.newPassword).length > 0
                ? 'text-rui-error'
                : 'text-rui-text-secondary'
            "
          >
            <li>
              {{ t('auth.common.password_hint.line_1') }}
            </li>
            <li>
              {{ t('auth.common.password_hint.line_2') }}
            </li>
            <li>
              {{ t('auth.common.password_hint.line_3') }}
            </li>
            <li>
              {{ t('auth.common.password_hint.line_4') }}
            </li>
          </ul>
        </div>

        <RuiRevealableTextField
          id="password-confirmation"
          v-model="state.passwordConfirmation"
          color="primary"
          :error-messages="toMessages(v$.passwordConfirmation)"
          variant="outlined"
          dense
          :label="t('auth.signup.account.form.confirm_password')"
          :hint="t('auth.common.confirm_hint')"
          autocomplete="new-password"
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
          @click="changePassword()"
        >
          {{ t('actions.update') }}
        </RuiButton>
      </div>
    </div>
  </div>

  <FloatingNotification
    type="success"
    closeable
    :visible="success"
    :timeout="3000"
    @dismiss="success = false"
  >
    {{ t('account.change_password.message.success') }}
  </FloatingNotification>
</template>
