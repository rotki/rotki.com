<script setup lang="ts">
import { useMounted } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AppLogo from '~/components/common/AppLogo.vue';
import NavigationMenu from '~/components/common/NavigationMenu.vue';
import SponsorNavButton from '~/components/common/SponsorNavButton.vue';
import { useMainStore } from '~/store';

const { t } = useI18n({ useScope: 'global' });

const store = useMainStore();
const { authenticated } = storeToRefs(store);

const isMounted = useMounted();

/**
 * Whether the header shows the signed-in links. Pages are prerendered signed out, and the startup
 * plugin loads the account before hydration, so the first render must stay signed out to match the
 * HTML: production Vue does not patch attributes that differ during hydration, which left "My
 * account" pointing at `/login` and the logout button out of the tab order.
 */
const signedIn = computed<boolean>(() => get(isMounted) && get(authenticated));

async function logout() {
  await store.logout(true);
  await navigateTo('/login');
}

const menuOpened = ref<boolean>(false);

const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    set(menuOpened, false);
  },
);
</script>

<template>
  <div class="py-4 md:py-6 border-b border-rui-grey-200">
    <div class="container">
      <div class="flex justify-between items-center md:hidden">
        <NuxtLink to="/">
          <AppLogo text />
        </NuxtLink>
        <div>
          <RuiButton
            icon
            variant="text"
            color="primary"
            aria-label="Open menu"
            @click="menuOpened = true"
          >
            <RuiIcon name="lu-menu" />
          </RuiButton>
        </div>
      </div>
      <div
        class="fixed w-full h-screen bg-black/[0.5] z-[10] top-0 left-0 flex justify-end items-start p-4 md:hidden"
        :class="{ 'invisible opacity-0': !menuOpened }"
        @click="menuOpened = false"
      >
        <RuiButton
          icon
          aria-label="Close menu"
        >
          <RuiIcon
            name="lu-x"
            color="primary"
          />
        </RuiButton>
      </div>
      <div
        class="transition-all h-full fixed top-0 left-0 bg-white z-[10] w-[calc(100%-5rem)] flex-col py-4 flex gap-y-4 md:h-auto md:static md:justify-center md:w-full md:flex-row md:py-0 md:items-center md:flex-wrap lg:justify-between lg:gap-y-0"
        :class="menuOpened ? 'left-0' : '!-left-full md:left-0'"
      >
        <NuxtLink
          to="/"
          class="flex w-full px-4 md:order-1 md:w-auto md:px-0 lg:order-none"
        >
          <AppLogo text />
        </NuxtLink>

        <!-- Between md and lg: logo and actions share the first row, the links take the second -->
        <NavigationMenu class="grow w-full p-2 md:p-0 flex-col border-y border-rui-grey-200 md:order-3 md:flex-row md:border-y-0 lg:order-none lg:w-auto" />

        <div class="flex flex-col space-y-2 px-2 md:order-2 md:ml-auto md:items-center md:flex-row md:space-y-0 md:space-x-2 md:px-0 lg:order-none lg:ml-0">
          <SponsorNavButton />
          <!-- The page is prerendered signed out, so a returning customer sees "Sign in" until the session check resolves -->
          <NuxtLink :to="signedIn ? '/home/subscription' : '/login'">
            <!-- Left-aligned in the mobile drawer to line up with the sponsor link above it -->
            <RuiButton
              variant="text"
              color="primary"
              class="w-full justify-start md:justify-center !px-2 md:!px-3 py-2 md:py-1.5"
            >
              <template #prepend>
                <RuiIcon
                  name="lu-circle-user-round"
                  size="18"
                />
              </template>
              {{ signedIn ? t('page_header.account') : t('page_header.sign_in') }}
            </RuiButton>
          </NuxtLink>
          <NuxtLink to="/download">
            <RuiButton
              rounded
              color="primary"
              class="w-full py-2 md:py-1.5"
            >
              <template #prepend>
                <RuiIcon
                  name="lu-download"
                  size="18"
                />
              </template>
              {{ t('page_header.download') }}
            </RuiButton>
          </NuxtLink>
          <RuiButton
            aria-label="Logout"
            color="primary"
            variant="text"
            icon
            class="!p-2"
            :class="{ invisible: !signedIn }"
            :tabindex="signedIn ? 0 : -1"
            @click="logout()"
          >
            <span class="flex items-center">
              <RuiIcon name="lu-log-out" />
              <span class="md:hidden ml-3">{{ t('logout') }}</span>
            </span>
          </RuiButton>
        </div>
      </div>
    </div>
  </div>
</template>
