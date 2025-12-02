<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

withDefaults(defineProps<{ text?: boolean }>(), { text: false });

const { isStaging } = useStagingBranding();
const branch = useRuntimeConfig().public.testing ? 'develop' : 'main';
</script>

<template>
  <ClientOnly>
    <template v-if="isStaging">
      <img
        src="/staging/logo.svg"
        alt="rotki staging"
        v-bind="$attrs"
      />
    </template>
    <template v-else>
      <RuiLogo
        :text="text"
        :branch="branch"
        logo="website"
        v-bind="$attrs"
      />
    </template>
    <template #fallback>
      <RuiLogo
        class="opacity-0 invisible transition delay-1000"
        :text="text"
        v-bind="$attrs"
      />
    </template>
  </ClientOnly>
</template>
