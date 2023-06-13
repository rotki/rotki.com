<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs, noIndex } from '~/utils/metadata';

const error = useError();
const { t } = useI18n();
const css = useCssModule();

const title = computed(() => get(error)?.message ?? '');
const statusCode = computed(() => {
  const err = get(error);
  return err && 'statusCode' in err ? err.statusCode : -1;
});

const handleError = () => clearError({ redirect: '/' });

useHead(() => ({
  title,
  meta: [noIndex()],
  ...commonAttrs(),
}));
</script>

<template>
  <PageContainer>
    <div v-if="error" :class="css.wrapper">
      <h1 :class="css.title">{{ statusCode }}</h1>
      <p :class="css.subtitle">{{ title }}</p>
      <ActionButton
        :text="t('actions.go_back_home')"
        primary
        small
        @click="handleError()"
      />
    </div>
  </PageContainer>
</template>

<style module lang="scss">
.wrapper {
  @apply text-center my-24;
}
.title {
  @apply block font-serif text-red-500 font-bold text-6xl;
}

.subtitle {
  @apply block font-sans font-light text-primary2 my-8 text-3xl;
}
</style>
