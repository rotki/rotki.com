<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { get, objectOmit, set } from '@vueuse/core';
import { useVuelidate } from '@vuelidate/core';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const email = computed(() => {
  const userAccount = account.value;
  return !userAccount ? '' : userAccount.email;
});

const state = reactive({
  githubUsername: '',
});

onBeforeMount(() => {
  reset();
});

const rules = {
  githubUsername: {},
};

const $externalResults = ref<Record<string, string[]>>({});

const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});

const reset = () => {
  const userAccount = get(account);

  if (!userAccount) {
    return;
  }

  state.githubUsername = userAccount.githubUsername;

  get(v$).$reset();
};

const loading = ref(false);
const done = ref(false);

const update = async () => {
  const userAccount = get(account);
  if (!userAccount) {
    return;
  }

  const isValid = await get(v$).$validate();
  if (!isValid) {
    return;
  }
  set(loading, true);

  const payload = objectOmit(
    {
      ...userAccount.address,
      ...state,
    },
    ['movedOffline'],
  );

  const { success, message } = await store.updateProfile(payload);
  if (success) {
    set(done, true);
  } else if (message && typeof message !== 'string') {
    set($externalResults, message);
  }
  set(loading, false);
};

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="text-h6 mb-6">Details</div>
    <div>
      <div class="space-y-5">
        <RuiTextField
          id="email"
          v-model="email"
          disabled
          variant="outlined"
          :label="t('auth.common.email')"
          hide-details
          color="primary"
        />

        <RuiTextField
          id="github"
          v-model="state.githubUsername"
          variant="outlined"
          color="primary"
          :label="t('auth.signup.account.form.github_username')"
          :hint="t('auth.signup.account.form.github_username_hint')"
          :error-messages="toMessages(v$.githubUsername)"
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
          @click="update()"
        >
          {{ t('actions.update') }}
        </RuiButton>
      </div>
    </div>
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
