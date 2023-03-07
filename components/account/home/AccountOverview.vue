<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const premium = computed(() => {
  return get(account)?.canUsePremium ?? false;
});

const username = computed(() => {
  return get(account)?.username;
});

onMounted(async () => await store.getAccount());

const logout = async () => {
  await store.logout(true);
  await navigateTo('/login');
};

const css = useCssModule();
</script>

<template>
  <PageContainer wide>
    <template #title> Account Management</template>
    <template #links>
      <LinkText>
        <span @click="logout">Logout</span>
      </LinkText>
    </template>
    <TextHeading :class="css.header"> Welcome {{ username }}</TextHeading>
    <SubscriptionTable :class="css.category" />
    <PaymentsTable :class="css.category" />
    <ApiKeys v-if="premium" :class="css.category" />
    <AccountDetails :class="css.category" />
    <DangerZone :class="css.category" />
  </PageContainer>
</template>

<style lang="scss" module>
.category {
  @apply mt-8;
}

.header {
  @apply pb-2;
}
</style>
