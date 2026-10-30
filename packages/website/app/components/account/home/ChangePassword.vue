<script setup lang="ts">
import type { ActionResult } from '~/types/common';
import { set } from '@vueuse/shared';
import { z } from 'zod';
import AccountSection from '~/components/account/home/AccountSection.vue';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import PasswordRules from '~/components/account/PasswordRules.vue';
import { useAccountApi } from '~/composables/account/use-account-api';
import { useFormRules } from '~/composables/use-form-rules';
import { useZodForm } from '~/composables/use-zod-form';
import { PASSWORD_MIN_LENGTH } from '~/utils/validation';

const open = ref<boolean>(false);
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
const { errors, hasError, invalid, serverErrors } = form;

const { start: startSuccessTimeout, stop: stopSuccessTimeout } = useTimeoutFn(() => {
  set(success, false);
}, 4000, { immediate: false });

async function changePassword(): Promise<void> {
  if (!form.validate())
    return;

  set(loading, true);
  const result: ActionResult = await accountApi.changePassword(state);
  set(loading, false);
  if (result.message && typeof result.message !== 'string')
    form.setExternalErrors(result.message);

  if (result.success) {
    set(success, true);
    stopSuccessTimeout();
    startSuccessTimeout();
    close();
  }
}

function close(): void {
  state.currentPassword = '';
  state.newPassword = '';
  state.passwordConfirmation = '';
  form.reset();
  set(open, false);
}
</script>

<template>
  <AccountSection
    :title="t('account.change_password.title')"
    :description="t('account.change_password.description')"
  >
    <template #actions>
      <RuiButton
        v-if="!open"
        color="primary"
        variant="outlined"
        aria-controls="change-password-form"
        :aria-expanded="open"
        @click="open = true"
      >
        {{ t('actions.change') }}
      </RuiButton>
    </template>
    <form
      v-if="open"
      id="change-password-form"
      class="max-w-2xl"
      @submit.prevent="changePassword()"
    >
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
            :invalid="hasError('newPassword')"
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

      <div class="mt-8 flex flex-wrap gap-3">
        <RuiButton
          type="submit"
          :disabled="invalid"
          :loading="loading"
          color="primary"
        >
          {{ t('account.change_password.submit') }}
        </RuiButton>
        <RuiButton
          variant="text"
          color="primary"
          @click="close()"
        >
          {{ t('actions.cancel') }}
        </RuiButton>
      </div>
    </form>
  </AccountSection>

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
