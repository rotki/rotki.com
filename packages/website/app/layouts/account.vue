<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import PageTabs, { type PageTabItem } from '~/components/common/PageTabs.vue';
import PageLayout from '~/components/layout/PageLayout.vue';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';

defineSlots<{
  default: () => void;
}>();

usePageSeoNoIndex('account');

const { t } = useI18n({ useScope: 'global' });
useAutoLogout();

const tabModelValue = ref<string>();
const hydrated = ref<boolean>(false);

const { account, hasCardPayment } = storeToRefs(useMainStore());

const name = computed<string>(() => {
  const userAccount = get(account);
  if (!userAccount)
    return '';

  const { firstName, lastName, movedOffline } = userAccount.address;

  if (movedOffline) {
    return userAccount.username;
  }

  return `${firstName} ${lastName}`;
});

const tabs = computed<PageTabItem[]>(() => {
  const all: PageTabItem[] = [{
    label: t('account.tabs.subscription'),
    icon: 'lu-crown',
    to: '/home/subscription',
  }, {
    label: t('account.tabs.payment_methods'),
    icon: 'lu-credit-card',
    to: '/home/saved-cards',
    reload: true,
  }, {
    label: t('account.tabs.devices'),
    icon: 'lu-laptop-minimal',
    to: '/home/devices',
  }, {
    label: t('account.tabs.account_details'),
    icon: 'lu-circle-user-round',
    to: '/home/account-details',
  }, {
    label: t('account.tabs.email_preferences'),
    icon: 'lu-mail',
    to: '/home/email-preferences',
  }, {
    label: t('account.tabs.customer_information'),
    icon: 'lu-info',
    to: '/home/customer-information',
  }, {
    label: t('account.tabs.address'),
    icon: 'lu-map-pin',
    to: '/home/address',
  }];

  return get(hasCardPayment)
    ? all
    : all.filter(tab => tab.to !== '/home/saved-cards');
});

onMounted(() => {
  set(hydrated, true);
});
</script>

<template>
  <PageLayout>
    <div class="py-10 lg:py-16">
      <div class="container">
        <template v-if="hydrated">
          <div class="text-h4 mb-6">
            {{ t('account.welcome') }} {{ name }}
          </div>
          <div class="flex flex-col xl:flex-row gap-6">
            <PageTabs
              v-model="tabModelValue"
              :tabs="tabs"
            />

            <div class="flex-1 overflow-x-auto">
              <slot />
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex items-center justify-center py-24"
        >
          <RuiProgress
            variant="indeterminate"
            size="48"
            circular
            color="primary"
          />
        </div>
      </div>
    </div>
  </PageLayout>
</template>
