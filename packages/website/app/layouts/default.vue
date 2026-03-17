<script setup lang="ts">
import PageFooter from '~/components/footer/PageFooter.vue';
import PageHeader from '~/components/header/PageHeader.vue';

defineSlots<{
  default: () => void;
}>();

const route = useRoute();

const isLanding = computed<boolean>(() => !!route.meta.landing);
</script>

<template>
  <div>
    <PageHeader />
  </div>
  <main class="flex flex-col grow">
    <slot />
  </main>
  <div>
    <PageFooter :landing="isLanding" />
  </div>
</template>
