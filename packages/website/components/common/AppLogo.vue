<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

withDefaults(defineProps<{ text?: boolean }>(), { text: false });

const branch = useRuntimeConfig().public.testing ? 'develop' : 'main';
</script>

<template>
  <ClientOnly>
    <RuiLogo
      :text="text"
      :branch="branch"
      logo="website"
      v-bind="$attrs"
    />
    <template #fallback>
      <RuiLogo
        class="opacity-0 invisible transition delay-1000"
        :text="text"
        v-bind="$attrs"
      />
    </template>
  </ClientOnly>
</template>
