<script setup lang="ts">
import AppLogo from '~/components/common/AppLogo.vue';
import { copyrightNotice } from '~/utils/copyright';

/**
 * A quiet frame for forms people should finish: the logo, one optional action on the right and the
 * copyright. Pages that set no action slot get only the logo.
 */
defineSlots<{
  default: () => void;
  action?: () => void;
}>();

const { t } = useI18n({ useScope: 'global' });

const copyright = copyrightNotice();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white md:bg-rui-grey-50">
    <header class="bg-white border-b border-default">
      <div class="container flex items-center justify-between gap-4 py-3 md:py-4">
        <NuxtLink
          to="/"
          :aria-label="t('logo.alt')"
        >
          <AppLogo text />
        </NuxtLink>
        <div
          v-if="$slots.action"
          class="text-body-2 text-rui-text-secondary"
        >
          <slot name="action" />
        </div>
      </div>
    </header>

    <main class="flex flex-col grow">
      <slot />
    </main>

    <footer class="border-t border-default bg-white">
      <div class="container py-6 text-body-2 text-rui-text-secondary">
        {{ copyright }} {{ t('page_footer.all_rights_reseved') }}
      </div>
    </footer>
  </div>
</template>
