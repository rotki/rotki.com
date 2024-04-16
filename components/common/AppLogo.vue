<script setup lang="ts">
withDefaults(defineProps<{ text?: boolean }>(), { text: false });

const attrs = useAttrs();
const branch = process.env.NODE_ENV === 'development' ? 'develop' : 'main';
</script>

<template>
  <ClientOnly>
    <RuiLogo
      :text="text"
      :branch="branch"
      logo="website"
      v-bind="attrs"
    />
    <template #fallback>
      <RuiLogo
        class="opacity-0 invisible transition delay-1000"
        :text="text"
        v-bind="attrs"
      />
    </template>
  </ClientOnly>
</template>
