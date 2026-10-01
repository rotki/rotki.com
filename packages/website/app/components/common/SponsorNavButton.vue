<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ButtonLink
    class="w-full justify-start !px-2 md:!px-3"
    to="/sponsor/mint"
    color="primary"
    variant="text"
    :title="t('navigation_menu.sponsor')"
    highlight-exact-active
  >
    <template #prepend>
      <RuiIcon
        name="lu-heart"
        size="18"
      />
    </template>
    {{ t('navigation_menu.sponsor_short') }}
  </ButtonLink>
</template>
