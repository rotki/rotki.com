<script setup lang="ts">
import { set } from '@vueuse/core';
import { useMainStore } from '~/store';
import type { ActionResult } from '~/types/common';

const { t } = useI18n();

const store = useMainStore();

const success = ref<boolean>(false);
const error = ref<string>('');

let pendingTimeout: any;

function reset() {
  set(success, false);
  set(error, '');
}

async function resend() {
  reset();
  const result: ActionResult = await store.resendVerificationCode(t);

  if (result.success)
    set(success, true);
  else
    set(error, result.message);

  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = undefined;
  }

  pendingTimeout = setTimeout(() => {
    reset();
  }, 4000);
}
</script>

<template>
  <RuiAlert type="warning">
    {{ t('account.unverified_email.message.description') }}
    <RuiButton
      color="secondary"
      size="sm"
      class="mt-2"
      @click="resend()"
    >
      <template #prepend>
        <RuiIcon
          name="mail-send-line"
          size="20"
        />
      </template>
      {{ t('account.unverified_email.resend') }}
    </RuiButton>
  </RuiAlert>

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
