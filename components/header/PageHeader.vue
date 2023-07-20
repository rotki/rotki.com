<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
const { t } = useI18n();

const store = useMainStore();
const { authenticated } = storeToRefs(store);

const logout = async () => {
  await store.logout(true);
  await navigateTo('/login');
};
</script>

<template>
  <div class="py-6 border-b border-grey-200">
    <div
      class="container flex items-center justify-center lg:justify-between flex-wrap lg:flex-row space-y-4 lg:space-y-0"
    >
      <NuxtLink to="/" class="flex justify-center w-full lg:w-auto">
        <RuiLogo text />
      </NuxtLink>
      <div>
        <NavigationMenu />
      </div>
      <div class="flex items-center space-x-2 ml-6">
        <NuxtLink to="/home">
          <RuiButton rounded color="primary">
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
          <RuiIcon name="logout-box-r-line" />
        </RuiButton>
      </div>
    </div>
  </div>
</template>
