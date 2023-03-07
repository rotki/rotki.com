<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { fetchWithCsrf } from '~/utils/api';

const route = useRoute();
const { uid, token } = route.params;
const validating = ref(true);
const isValid = ref(false);

const validateToken = async () => {
  const response = await fetchWithCsrf(`/webapi/activate/${uid}/${token}/`);

  if (!get(response).error) {
    set(isValid, true);
  }

  set(validating, false);
};

onBeforeMount(async () => await validateToken());

const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Account Activation </template>
    <div :class="css.content">
      <div v-if="!validating">
        <UserActionMessage v-if="isValid">
          <template #header>Welcome to rotki</template>

          <p>Your rotki account has been successfully activated.</p>
          <div>
            To see your dashboard click
            <ExternalLink same-tab text="here" url="/home" />
          </div>
        </UserActionMessage>
        <UserActionMessage v-else>
          <template #header>Invalid Link</template>
          <p>The activation link is not valid.</p>
          <p>This can happen if you have already confirmed your account.</p>
        </UserActionMessage>
      </div>
      <div v-else>
        <LoadingIndicator />
      </div>
    </div>
  </PageContainer>
</template>

<style module lang="scss">
.content {
  @apply flex flex-row justify-center;
}
</style>
