<script setup lang="ts">
import type { ActionResult } from '~/types/common';
import { set } from '@vueuse/shared';
import { z } from 'zod';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import PasswordRules from '~/components/account/PasswordRules.vue';
import { useAccountApi } from '~/composables/account/use-account-api';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';
import { PASSWORD_MIN_LENGTH } from '~/utils/validation';

const loading = ref<boolean>(false);
const success = ref<boolean>(false);

const accountApi = useAccountApi();

const state = reactive({
  currentPassword: '',
  newPassword: '',
  passwordConfirmation: '',
});

const { t } = useI18n({ useScope: 'global' });
const { password, required } = useFormRules();

const form = useZodForm(z.object({
  currentPassword: required().min(PASSWORD_MIN_LENGTH, { error: t('validation.password_too_short') }),
  newPassword: password(),
  passwordConfirmation: required(),
}).refine(value => value.newPassword === value.passwordConfirmation, {
  error: t('validation.passwords_differ'),
  path: ['passwordConfirmation'],
}), state);
const { errors, invalid, serverErrors } = form;

const { start: startSuccessTimeout, stop: stopSuccessTimeout } = useTimeoutFn(() => {
  set(success, false);
}, 4000, { immediate: false });

async function changePassword(): Promise<void> {
  set(loading, true);
  const result: ActionResult = await accountApi.changePassword(state);
  set(loading, false);
  if (result.message && typeof result.message !== 'string')
    form.setExternalErrors(result.message);

  if (result.success) {
    set(success, true);
    stopSuccessTimeout();
    startSuccessTimeout();
    reset();
  }
}

function reset(): void {
  state.currentPassword = '';
  state.newPassword = '';
  state.passwordConfirmation = '';
  form.reset();
}
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
          color="primary"
          dense
          :error-messages="errors('currentPassword')"
          :hint="t('account.change_password.current_password.hint')"
          :label="t('account.change_password.current_password.label')"
          autocomplete="current-password"
        />

        <div class="space-y-1">
          <RuiRevealableTextField
            id="new-password"
            v-model="state.newPassword"
            color="primary"
            dense
            details="hidden"
            :label="t('account.change_password.new_password.label')"
            autocomplete="new-password"
            :error-messages="errors('newPassword')"
          />

          <PasswordRules
            :password="state.newPassword"
            :errors="serverErrors('newPassword')"
          />
        </div>

        <RuiRevealableTextField
          id="password-confirmation"
          v-model="state.passwordConfirmation"
          color="primary"
          :error-messages="errors('passwordConfirmation')"
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
          :disabled="invalid"
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
