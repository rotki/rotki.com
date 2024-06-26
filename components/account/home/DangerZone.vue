<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import type { ActionResult } from '~/types/common';

const confirm = ref(false);
const usernameConfirmation = ref('');
const error = ref('');

const store = useMainStore();
const { account } = storeToRefs(store);

const username = computed(() => get(account)?.username);
const isSubscriber = computed(
  () => get(account)?.hasActiveSubscription ?? false,
);

const { start, stop } = useTimeoutFn(
  () => {
    set(error, '');
  },
  4500,
  { immediate: false },
);

async function deleteAccount() {
  dismissNotification();
  set(confirm, false);
  const result: ActionResult = await store.deleteAccount({
    username: get(usernameConfirmation),
  });
  if (result.success) {
    await store.logout();
    await navigateTo('/account-deleted');
  }
  else {
    set(error, typeof result.message === 'string' ? result.message : '');
    start();
  }
}

function dismissNotification() {
  stop();
  set(error, '');
}

const { t } = useI18n();
</script>

<template>
  <RuiCard
    class="!border-2"
    :class="{ '!border-rui-error': !isSubscriber }"
  >
    <div>
      <div
        class="text-lg font-semibold"
        :class="isSubscriber ? 'text-rui-text-disabled' : 'text-rui-error'"
      >
        {{ t('account.delete_account.title') }}
      </div>
      <div class="text-rui-text-secondary text-body-1">
        {{ t('account.delete_account.description') }}
      </div>
    </div>
    <div
      v-if="isSubscriber"
      class="text-body-1 font-bold text-rui-text-secondary mt-1"
    >
      {{ t('account.delete_account.unable_to_delete') }}
    </div>
    <div class="mt-8">
      <RuiButton
        :disabled="isSubscriber"
        size="lg"
        color="error"
        @click="confirm = true"
      >
        {{ t('account.delete_account.delete_my_account') }}
      </RuiButton>
    </div>
  </RuiCard>
  <RuiDialog
    v-model="confirm"
    max-width="900"
  >
    <RuiCard>
      <template #header>
        {{ t('account.delete_account.title') }}
      </template>

      <div class="whitespace-break-spaces mb-4">
        <i18n-t
          keypath="account.delete_account.confirmation.description"
          scope="global"
        >
          <template #username>
            <strong>{{ username }}</strong>
          </template>
        </i18n-t>
      </div>

      <RuiTextField
        v-model="usernameConfirmation"
        color="primary"
        variant="outlined"
        :label="t('auth.common.username')"
      />

      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          variant="text"
          color="primary"
          @click="confirm = false"
        >
          {{ t('actions.cancel') }}
        </RuiButton>
        <RuiButton
          :disabled="usernameConfirmation !== username"
          color="error"
          @click="deleteAccount()"
        >
          {{ t('actions.confirm') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>

  <FloatingNotification
    closeable
    :visible="!!error"
    :timeout="3000"
    @dismiss="dismissNotification()"
  >
    <template #title>
      {{ t('account.delete_account.notification.title') }}
    </template>
    {{ error }}
  </FloatingNotification>
</template>
