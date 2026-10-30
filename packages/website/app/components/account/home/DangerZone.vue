<script setup lang="ts">
import type { ActionResult } from '~/types/common';
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountSection from '~/components/account/home/AccountSection.vue';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useAccountApi } from '~/composables/account/use-account-api';
import { useMainStore } from '~/store';

const confirm = ref<boolean>(false);
const usernameConfirmation = ref<string>('');
const error = ref<string>('');

const store = useMainStore();
const accountApi = useAccountApi();
const { account } = storeToRefs(store);

const username = computed<string | undefined>(() => get(account)?.username);
const isSubscriber = computed<boolean>(
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
  const result: ActionResult = await accountApi.deleteAccount({
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

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AccountSection :title="t('account.delete_account.title')">
    <div
      class="max-w-2xl rounded-lg border p-4 md:p-6"
      :class="isSubscriber ? 'border-default' : 'border-rui-error/40'"
    >
      <p class="text-body-2 text-rui-text-secondary text-pretty">
        {{ t('account.delete_account.description') }}
      </p>
      <p
        v-if="isSubscriber"
        class="mt-2 text-body-2 font-medium text-rui-text"
      >
        {{ t('account.delete_account.unable_to_delete') }}
      </p>
      <RuiButton
        :disabled="isSubscriber"
        color="error"
        variant="outlined"
        class="mt-5"
        @click="confirm = true"
      >
        {{ t('account.delete_account.delete_my_account') }}
      </RuiButton>
    </div>
  </AccountSection>
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
