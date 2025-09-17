<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const year = new Date().getFullYear().toString();
const copyright = `© Rotki Solutions GmbH 2018-${year}.`;
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <div class="py-4 md:py-6 border-b border-rui-grey-200">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between">
          <!-- Logo on the left -->
          <NuxtLink
            to="/"
            class="flex items-center"
          >
            <img
              src="/img/logo-small.svg"
              :alt="t('logo.alt')"
              class="h-10"
            />
          </NuxtLink>

          <!-- Buttons on the right -->
          <div class="flex items-center gap-3">
            <NuxtLink to="/">
              <button class="px-4 py-2 text-rui-primary hover:bg-rui-primary/10 text-sm transition-colors">
                {{ t('navigation_menu.home') }}
              </button>
            </NuxtLink>
            <NuxtLink to="/home/subscription">
              <button class="px-4 py-2 bg-rui-primary text-white rounded-full hover:bg-rui-primary-darker transition-colors text-sm font-medium shadow-sm">
                {{ t('page_header.manage_premium') }}
              </button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1">
      <slot />
    </div>

    <!-- Footer -->
    <div class="border-t border-rui-grey-100">
      <div class="container mx-auto px-4">
        <div class="flex flex-col-reverse lg:flex-row justify-between items-start md:items-center pt-8 pb-12">
          <!-- Copyright on the left -->
          <div class="flex flex-wrap space-x-1 text-rui-text-secondary mt-6 lg:mt-0">
            <div>{{ copyright }}</div>
            <div>{{ t('page_footer.all_rights_reseved') }}</div>
          </div>
          <div />
        </div>
      </div>
    </div>
  </div>
</template>
