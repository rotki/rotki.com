<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ButtonLink
    class="w-full justify-start !px-3"
    to="/sponsor/mint"
    color="primary"
    variant="outlined"
    highlight-exact-active
  >
    {{ t('navigation_menu.sponsor') }}
  </ButtonLink>
</template>
