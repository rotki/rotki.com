<script setup lang="ts">
import SignupForm from '~/components/account/signup/SignupForm.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: false,
});

usePageSeoNoIndex('Create an account');

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
</script>

<template>
  <NuxtLayout name="focused">
    <template #action>
      <span class="hidden sm:inline">{{ t('auth.signup.already_have_account') }}</span>
      <ButtonLink
        :to="{
          path: '/login',
          query: route.query,
        }"
        inline
        color="primary"
      >
        {{ t('auth.login.title') }}
      </ButtonLink>
    </template>
    <SignupForm />
  </NuxtLayout>
</template>
