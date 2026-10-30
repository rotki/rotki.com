<script setup lang="ts">
import type { ActionResult } from '~/types/common';
import { set } from '@vueuse/shared';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useAccountApi } from '~/composables/account/use-account-api';

const { t } = useI18n({ useScope: 'global' });

const accountApi = useAccountApi();

const success = ref<boolean>(false);
const error = ref<string>('');

function reset(): void {
  set(success, false);
  set(error, '');
}

const { start: startResetTimeout, stop: stopResetTimeout } = useTimeoutFn(() => {
  reset();
}, 4000, { immediate: false });

async function resend(): Promise<void> {
  reset();
  const result: ActionResult = await accountApi.resendVerificationCode(t);

  if (result.success)
    set(success, true);
  else
    set(error, result.message);

  stopResetTimeout();
  startResetTimeout();
}
</script>

<template>
  <div
    role="status"
    class="border-b border-rui-warning/30 bg-rui-warning/10"
  >
    <div class="container py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <RuiIcon
        name="lu-mail"
        size="18"
        class="shrink-0 text-rui-warning-darker"
      />
      <p class="flex-1 min-w-60 text-body-2 text-rui-text">
        {{ t('account.unverified_email.message.description') }}
      </p>
      <RuiButton
        color="primary"
        variant="outlined"
        size="sm"
        @click="resend()"
      >
        {{ t('account.unverified_email.resend') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    type="success"
    closeable
    :visible="success"
    :timeout="4000"
    @dismiss="success = false"
  >
    {{ t('account.unverified_email.message.success') }}
  </FloatingNotification>

  <FloatingNotification
    closeable
    :visible="!!error"
    :timeout="4000"
    @dismiss="error = ''"
  >
    <template #title>
      {{ t('account.unverified_email.message.error') }}
    </template>
    <div class="whitespace-break-spaces">
      {{ error }}
    </div>
  </FloatingNotification>
</template>
