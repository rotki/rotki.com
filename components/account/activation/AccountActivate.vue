<script setup lang="ts">
import { set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';

const route = useRoute();
const { uid, token } = route.params;
const validating = ref(true);
const isValid = ref(false);

const validateToken = async () => {
  try {
    await fetchWithCsrf(`/webapi/activate/${uid}/${token}/`);
    set(isValid, true);
  } catch (e: any) {
    if (!(e instanceof FetchError && e.status === 404)) {
      logger.debug(e);
    }
  } finally {
    set(validating, false);
  }
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
            <ButtonLink to="/home" inline color="primary">here</ButtonLink>
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
