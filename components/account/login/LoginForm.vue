<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { useMainStore } from '~/store';

const props = withDefaults(defineProps<{ modal?: boolean }>(), {
  modal: false,
});

const emit = defineEmits<{ (e: 'complete'): void }>();

const { modal } = toRefs(props);
const username = ref<string>('');
const password = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string>('');
const hadError = ref<boolean>(false);

const rules = {
  username: { required },
  password: { required },
};

const v$ = useVuelidate(
  rules,
  {
    username,
    password,
  },
  {
    $autoDirty: true,
  },
);

const { login } = useMainStore();

async function performLogin() {
  set(loading, true);
  set(
    error,
    await login({
      username: username.value,
      password: password.value,
    }),
  );
  set(loading, false);

  if (!get(error)) {
    if (get(modal))
      emit('complete');
    else
      await navigateTo('/home/subscription');
  }
  else {
    set(hadError, true);
  }
}

const { t } = useI18n();
</script>

<template>
  <div class="w-[360px] max-w-full space-y-8">
    <div class="space-y-3">
      <div class="text-h4">
        {{ t('auth.login.title') }}
      </div>
      <div class="text-body-1 text-rui-text-secondary">
        {{ t('auth.login.message') }}
      </div>
    </div>
    <form @submit.prevent="">
      <div class="space-y-5">
        <RuiTextField
          id="username"
          v-model="username"
          dense
          variant="outlined"
          :disabled="loading"
          :label="t('auth.common.username')"
          autocomplete="username"
          hide-details
          color="primary"
          :error-messages="error ? [error] : []"
          @focus="error = ''"
        />

        <RuiRevealableTextField
          id="password"
          v-model="password"
          variant="outlined"
          :disabled="loading"
          dense
          :label="t('auth.common.password')"
          autocomplete="current-password"
          hide-details
          color="primary"
          :error-messages="error ? [error] : []"
          @enter="performLogin()"
          @focus="error = ''"
        />
      </div>

      <div class="flex justify-end mb-6 mt-2">
        <ButtonLink
          to="/password/recover"
          :disabled="loading"
          inline
        >
          {{ t('auth.login.forgot_password') }}
        </ButtonLink>
      </div>

      <div
        v-if="error"
        class="text-body-1 text-center text-rui-error pb-6"
      >
        {{ error }}
      </div>

      <RuiButton
        :disabled="v$.$invalid || loading"
        color="primary"
        :loading="loading"
        class="w-full"
        size="lg"
        type="submit"
        @click="performLogin()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </form>
    <div class="flex items-center justify-center">
      <span class="text-rui-text-secondary">
        {{ t('auth.login.first_time_premium') }}
      </span>
      <ButtonLink
        to="/signup"
        inline
        color="primary"
      >
        {{ t('auth.login.sign_up_now') }}
      </ButtonLink>
    </div>
  </div>
  <div
    v-if="hadError"
    class="max-w-full"
    :class="modal ? 'w-[360px] mt-8' : 'w-[660px] mt-14'"
  >
    <RuiAlert
      type="error"
      :description="t('auth.login.alert_error')"
    />
  </div>
</template>
