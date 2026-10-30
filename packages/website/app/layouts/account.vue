<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import SubscriptionErrorNotification from '~/components/account/home/SubscriptionErrorNotification.vue';
import UnverifiedEmailWarning from '~/components/account/home/UnverifiedEmailWarning.vue';
import PageLayout from '~/components/layout/PageLayout.vue';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';
import { requiresHardReload } from '~/utils/navigation';
import { removeTrailingSlash } from '~/utils/text';

interface AccountTab {
  label: string;
  /** Shorter label for the phone tab bar, when the label does not fit. */
  shortLabel?: string;
  description: string;
  icon: string;
  to: string;
}

defineSlots<{
  default: () => void;
}>();
const NAV_ITEM_CLASS = 'flex items-center gap-3 h-11 px-3 rounded-lg text-body-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-rui-primary';
const NAV_ITEM_IDLE_CLASS = 'text-rui-text-secondary hover:bg-rui-grey-100 hover:text-rui-text dark:hover:bg-rui-grey-800';

usePageSeoNoIndex('account');

const { t } = useI18n({ useScope: 'global' });
useAutoLogout();

const hydrated = ref<boolean>(false);

const store = useMainStore();
const { account } = storeToRefs(store);
const route = useRoute();

const name = computed<string>(() => {
  const userAccount = get(account);
  if (!userAccount)
    return '';

  const { firstName, lastName, movedOffline } = userAccount.address;
  const fullName = movedOffline ? '' : `${firstName} ${lastName}`.trim();
  return fullName || userAccount.username;
});

const initial = computed<string>(() => get(name).charAt(0).toUpperCase());
const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? true);

const tabs = computed<AccountTab[]>(() => [{
  label: t('account.tabs.overview'),
  description: t('account.tab_descriptions.overview'),
  icon: 'lu-layout-dashboard',
  to: '/home/subscription',
}, {
  label: t('account.tabs.billing'),
  description: t('account.tab_descriptions.billing'),
  icon: 'lu-credit-card',
  to: '/home/billing',
}, {
  label: t('account.tabs.devices'),
  shortLabel: t('account.tabs.devices_short'),
  description: t('account.tab_descriptions.devices'),
  icon: 'lu-laptop-minimal',
  to: '/home/devices',
}, {
  label: t('account.tabs.account'),
  description: t('account.tab_descriptions.account'),
  icon: 'lu-circle-user-round',
  to: '/home/account-details',
}]);

const currentTab = computed<AccountTab | undefined>(() =>
  get(tabs).find(tab => removeTrailingSlash(route.path) === tab.to),
);

function isCurrent(tab: AccountTab): boolean {
  return get(currentTab)?.to === tab.to;
}

async function logout(): Promise<void> {
  await store.logout(true);
  await navigateTo('/login');
}

onMounted(() => {
  set(hydrated, true);
});
</script>

<template>
  <PageLayout>
    <template v-if="hydrated">
      <UnverifiedEmailWarning v-if="account && !emailConfirmed" />

      <div class="container py-10 lg:py-14 flex flex-col lg:flex-row gap-8 lg:gap-12">
        <aside class="lg:w-60 shrink-0 flex flex-col gap-6">
          <div
            v-if="account"
            class="flex items-center gap-3 min-w-0"
          >
            <span
              aria-hidden="true"
              class="size-11 shrink-0 rounded-full bg-rui-primary/10 text-rui-primary grid place-items-center text-h6"
            >
              {{ initial }}
            </span>
            <div class="min-w-0">
              <p class="text-body-1 font-medium text-rui-text truncate">
                {{ name }}
              </p>
              <p class="text-body-2 text-rui-text-secondary truncate">
                {{ account.email }}
              </p>
            </div>
          </div>
          <div
            v-else
            class="flex items-center gap-3"
          >
            <RuiSkeletonLoader
              class="size-11"
              rounded="full"
            />
            <div class="flex-1 space-y-2">
              <RuiSkeletonLoader class="h-4 w-24" />
              <RuiSkeletonLoader class="h-3.5 w-36" />
            </div>
          </div>

          <nav
            :aria-label="t('account.navigation')"
            class="hidden lg:flex flex-col gap-0.5"
          >
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              :external="requiresHardReload(tab.to)"
              :aria-current="isCurrent(tab) ? 'page' : undefined"
              :class="[NAV_ITEM_CLASS, isCurrent(tab) ? 'bg-rui-primary/10 text-rui-primary' : NAV_ITEM_IDLE_CLASS]"
            >
              <RuiIcon
                :name="tab.icon"
                size="18"
              />
              {{ tab.label }}
            </NuxtLink>
          </nav>

          <div class="hidden lg:flex flex-col gap-0.5 pt-4 border-t border-default">
            <NuxtLink
              to="/download"
              :class="[NAV_ITEM_CLASS, NAV_ITEM_IDLE_CLASS]"
            >
              <RuiIcon
                name="lu-download"
                size="18"
              />
              {{ t('account.download_app') }}
            </NuxtLink>
            <button
              type="button"
              :class="[NAV_ITEM_CLASS, NAV_ITEM_IDLE_CLASS]"
              @click="logout()"
            >
              <RuiIcon
                name="lu-log-out"
                size="18"
              />
              {{ t('account.sign_out') }}
            </button>
          </div>

          <nav
            :aria-label="t('account.navigation')"
            class="lg:hidden grid grid-cols-4 gap-1 p-1 rounded-xl bg-rui-grey-100 dark:bg-rui-grey-900"
          >
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              :external="requiresHardReload(tab.to)"
              :aria-current="isCurrent(tab) ? 'page' : undefined"
              class="flex items-center justify-center h-10 px-1 rounded-lg text-body-2 font-medium text-center transition-colors focus-visible:outline-2 focus-visible:outline-rui-primary"
              :class="isCurrent(tab) ? 'bg-white dark:bg-rui-grey-800 text-rui-primary shadow-sm' : 'text-rui-text-secondary hover:text-rui-text'"
            >
              {{ tab.shortLabel ?? tab.label }}
            </NuxtLink>
          </nav>
        </aside>

        <div class="flex-1 min-w-0">
          <div
            v-if="currentTab"
            class="mb-8"
          >
            <h1 class="text-h5 md:text-h4 text-rui-text text-pretty">
              {{ currentTab.label }}
            </h1>
            <p class="mt-2 max-w-2xl text-body-1 text-rui-text-secondary text-pretty">
              {{ currentTab.description }}
            </p>
          </div>
          <slot />
        </div>
      </div>

      <SubscriptionErrorNotification />
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
  </PageLayout>
</template>
