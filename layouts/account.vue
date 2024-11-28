<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import Default from '~/layouts/default.vue';
import { useMainStore } from '~/store';
import { commonAttrs, noIndex } from '~/utils/metadata';

const { t } = useI18n();

const { account } = storeToRefs(useMainStore());

const name = computed<string>(() => {
  const accountVal = get(account);
  if (!accountVal)
    return '';

  const { firstName, lastName, movedOffline } = accountVal.address;

  if (movedOffline) {
    return accountVal.username;
  }

  return `${firstName} ${lastName}`;
});

useHead({
  title: 'account',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Manage your rotki premium account',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

useAutoLogout();
const tabModelValue = ref();
</script>

<template>
  <Default>
    <div class="py-10 lg:py-16">
      <div class="container">
        <div class="text-h4 mb-6">
          {{ t('account.welcome') }} {{ name }}
        </div>
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="hidden lg:block w-[270px] shrink-0">
            <RuiTabs
              v-model="tabModelValue"
              vertical
              align="start"
              color="primary"
            >
              <RuiTab
                link
                to="/home/subscription"
              >
                <template #prepend>
                  <RuiIcon name="vip-crown-line" />
                </template>
                {{ t('account.tabs.subscription') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/account-details"
              >
                <template #prepend>
                  <RuiIcon name="account-circle-line" />
                </template>
                {{ t('account.tabs.account_details') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/customer-information"
              >
                <template #prepend>
                  <RuiIcon name="information-line" />
                </template>
                {{ t('account.tabs.customer_information') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/address"
              >
                <template #prepend>
                  <RuiIcon name="map-pin-line" />
                </template>
                {{ t('account.tabs.address') }}
              </RuiTab>
            </RuiTabs>
          </div>
          <div class="lg:hidden">
            <RuiTabs
              v-model="tabModelValue"
              grow
              color="primary"
            >
              <RuiTab
                link
                to="/home/subscription"
              >
                <template #prepend>
                  <RuiIcon
                    class="shrink-0"
                    name="vip-crown-line"
                  />
                </template>
                {{ t('account.tabs.subscription') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/account-details"
              >
                <template #prepend>
                  <RuiIcon
                    class="shrink-0"
                    name="account-circle-line"
                  />
                </template>
                {{ t('account.tabs.account_details') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/customer-information"
              >
                <template #prepend>
                  <RuiIcon
                    class="shrink-0"
                    name="information-line"
                  />
                </template>
                {{ t('account.tabs.customer_information') }}
              </RuiTab>
              <RuiTab
                link
                to="/home/address"
              >
                <template #prepend>
                  <RuiIcon
                    class="shrink-0"
                    name="map-pin-line"
                  />
                </template>
                {{ t('account.tabs.address') }}
              </RuiTab>
            </RuiTabs>
          </div>

          <div class="flex-1 overflow-x-auto">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Default>
</template>
