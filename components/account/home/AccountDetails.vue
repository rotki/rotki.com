<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const {
  public: {
    contact: { emailMailto, email: rotkiEmail },
  },
} = useRuntimeConfig();

const email = computed(() => {
  const userAccount = get(account);
  return !userAccount ? '' : userAccount.email;
});

const username = computed(() => {
  const userAccount = get(account);
  return !userAccount ? '' : userAccount.username;
});

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account_details.title') }}
    </div>
    <div>
      <div class="space-y-5">
        <RuiTextField
          id="email"
          v-model="username"
          disabled
          dense
          class="[&_input]:!text-rui-text"
          variant="outlined"
          :label="t('auth.common.username')"
          hide-details
          color="primary"
          append-icon="lu-lock-keyhole"
        />
        <div>
          <RuiTextField
            id="email"
            v-model="email"
            disabled
            dense
            class="[&_input]:!text-rui-text"
            variant="outlined"
            :label="t('auth.common.email')"
            hide-details
            color="primary"
            append-icon="lu-lock-keyhole"
          />
          <div class="text-rui-text-secondary pt-2 px-3 text-xs flex">
            {{ t('account_details.check_email') }}
            <ButtonLink
              :to="emailMailto"
              external
              color="primary"
              variant="text"
              class="leading-[0]"
              inline
            >
              {{ rotkiEmail }}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div class="mt-10 mb-5 border-t border-grey-50" />
    </div>
  </div>
</template>
