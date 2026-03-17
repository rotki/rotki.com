<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import Default from '~/layouts/default.vue';
import { useMainStore } from '~/store';

interface TabItem {
  icon: string;
  label: string;
  to: string;
  reload?: boolean;
}

defineSlots<{
  default: () => void;
}>();

usePageSeoNoIndex('account');

const { t } = useI18n({ useScope: 'global' });
useAutoLogout();

const tabModelValue = ref<string>();
const hydrated = ref<boolean>(false);

const { account } = storeToRefs(useMainStore());

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

const tabs = computed<TabItem[]>(() => [{
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
  label: t('account.tabs.customer_information'),
  icon: 'lu-info',
  to: '/home/customer-information',
}, {
  label: t('account.tabs.address'),
  icon: 'lu-map-pin',
  to: '/home/address',
}]);

onMounted(() => {
  set(hydrated, true);
});
</script>

<template>
  <Default>
    <div class="py-10 lg:py-16">
      <div class="container">
        <template v-if="hydrated">
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
                  v-for="tab in tabs"
                  :key="tab.to"
                  link
                  :to="tab.to"
                  :target="tab.reload ? '_top' : undefined"
                >
                  <template #prepend>
                    <RuiIcon :name="tab.icon" />
                  </template>
                  {{ tab.label }}
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
                  v-for="tab in tabs"
                  :key="tab.to"
                  link
                  :to="tab.to"
                  :target="tab.reload ? '_top' : undefined"
                >
                  <template #prepend>
                    <RuiIcon
                      class="shrink-0"
                      :name="tab.icon"
                    />
                  </template>
                  {{ tab.label }}
                </RuiTab>
              </RuiTabs>
            </div>

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
  </Default>
</template>
