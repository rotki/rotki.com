<script setup lang="ts">
import { set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import AppLogo from '~/components/common/AppLogo.vue';
import NavigationMenu from '~/components/common/NavigationMenu.vue';
import { useMainStore } from '~/store';

const { t } = useI18n({ useScope: 'global' });

const store = useMainStore();
const { authenticated } = storeToRefs(store);

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
        <RuiButton icon>
          <RuiIcon
            name="lu-x"
            color="primary"
          />
        </RuiButton>
      </div>
      <div
        class="transition-all h-full fixed top-0 left-0 bg-white z-[10] w-[calc(100%-5rem)] flex-col py-4 flex gap-y-4 md:h-auto md:static md:justify-center md:w-full md:flex-row md:py-0 md:items-center md:flex-wrap xl:justify-between xl:gap-y-0"
        :class="menuOpened ? 'left-0' : '-left-full md:left-0'"
      >
        <NuxtLink
          to="/"
          class="flex w-full px-4 md:justify-center md:px-0 lg:w-auto"
        >
          <AppLogo text />
        </NuxtLink>

        <NavigationMenu class="grow w-full p-2 md:p-0 flex-col border-y border-rui-grey-200 md:w-auto md:flex-row md:border-y-0" />

        <div class="flex flex-col space-y-2 px-4 md:items-center md:flex-row md:space-y-0 md:space-x-2 md:px-0">
          <NuxtLink to="/home/subscription">
            <RuiButton
              rounded
              color="primary"
              class="w-full py-2 md:py-1.5"
            >
              {{ t('page_header.manage_premium') }}
            </RuiButton>
          </NuxtLink>
          <RuiButton
            v-if="authenticated"
            title="Logout"
            color="primary"
            variant="text"
            icon
            class="!p-2"
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
