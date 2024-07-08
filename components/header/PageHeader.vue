<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { set } from '@vueuse/core';
import { useMainStore } from '~/store';

const { t } = useI18n();

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

const css = useCssModule();
</script>

<template>
  <div class="py-4 md:py-6 border-b border-rui-grey-200">
    <div class="container">
      <div :class="css['mobile-header']">
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
            <RuiIcon name="menu-line" />
          </RuiButton>
        </div>
      </div>
      <div
        :class="[css.overlay, { [css.overlay__closed]: !menuOpened }]"
        @click="menuOpened = false"
      >
        <RuiButton icon>
          <RuiIcon
            name="close-line"
            color="primary"
          />
        </RuiButton>
      </div>
      <div :class="[css.wrapper, { [css.wrapper__closed]: !menuOpened }]">
        <NuxtLink
          to="/"
          :class="css.logo"
        >
          <AppLogo text />
        </NuxtLink>

        <NavigationMenu :class="css.navigation" />

        <div :class="css.auth">
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
              <RuiIcon name="logout-box-r-line" />
              <span class="md:hidden ml-3">{{ t('logout') }}</span>
            </span>
          </RuiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.overlay {
  @apply fixed w-full h-screen bg-black/[0.5] z-[10] top-0 left-0 flex justify-end items-start p-4;
  @apply md:hidden;

  &__closed {
    @apply invisible opacity-0;
  }
}

.wrapper {
  @apply transition-all h-full fixed top-0 left-0 bg-white z-[10] w-[calc(100%-5rem)] flex-col py-4 flex space-y-4;
  @apply md:h-auto md:static md:justify-center md:w-full md:flex-row md:py-0 md:items-center md:flex-wrap;
  @apply lg:justify-between lg:space-y-0;

  &__closed {
    @apply -left-full md:left-0;
  }
}

.mobile-header {
  @apply flex justify-between items-center;
  @apply md:hidden;
}

.logo {
  @apply flex w-full px-4;
  @apply md:justify-center md:px-0;
  @apply lg:w-auto;
}

.navigation {
  @apply grow w-full p-2 md:p-0 flex-col border-y border-rui-grey-200;
  @apply md:w-auto md:flex-row md:border-y-0;
}

.auth {
  @apply flex flex-col space-y-2 px-4;
  @apply md:items-center md:flex-row md:space-y-0 md:space-x-2 md:px-0;
}
</style>
