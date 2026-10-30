<script setup lang="ts">
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountSection from '~/components/account/home/AccountSection.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const {
  public: {
    contact: { emailMailto, email: rotkiEmail },
  },
} = useRuntimeConfig();

const email = computed<string>(() => {
  const userAccount = get(account);
  return !userAccount ? '' : userAccount.email;
});

const username = computed<string>(() => {
  const userAccount = get(account);
  return !userAccount ? '' : userAccount.username;
});

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AccountSection :title="t('account_details.title')">
    <div class="max-w-2xl space-y-5">
      <RuiTextField
        id="username"
        v-model="username"
        readonly
        dense
        :label="t('auth.common.username')"
        details="hidden"
        color="primary"
        append-icon="lu-lock-keyhole"
      />
      <div>
        <RuiTextField
          id="email"
          v-model="email"
          readonly
          dense
          :label="t('auth.common.email')"
          details="hidden"
          color="primary"
          append-icon="lu-lock-keyhole"
        />
        <p class="mt-1.5 text-caption text-rui-text-secondary">
          {{ t('account_details.check_email') }}
          <ButtonLink
            :to="emailMailto"
            external
            color="primary"
            inline
          >
            {{ rotkiEmail }}
          </ButtonLink>
        </p>
      </div>
    </div>
  </AccountSection>
</template>
