<script setup lang="ts">
import { RuiButton, RuiIcon } from '@rotki/ui-library';
const { t } = useI18n();
</script>

<template>
  <div class="flex space-x-4 flex-wrap justify-center">
    <NuxtLink to="/">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.home') }}
      </RuiButton>
    </NuxtLink>
    <NuxtLink v-if="false" to="/download">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.download') }}
      </RuiButton>
    </NuxtLink>
    <NuxtLink to="/jobs">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.jobs') }}
      </RuiButton>
    </NuxtLink>
    <NuxtLink v-if="false" to="/values">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.values') }}
      </RuiButton>
    </NuxtLink>
    <NuxtLink v-if="false" to="/features">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.features') }}
      </RuiButton>
    </NuxtLink>
    <a
      href="https://rotki.readthedocs.io/en/latest/index.html"
      rel="noreferrer"
      target="_blank"
    >
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.documentation') }}
        <template #append>
          <RuiIcon name="external-link-line" />
        </template>
      </RuiButton>
    </a>
    <a href="https://blog.rotki.com/" rel="noreferrer" target="_blank">
      <RuiButton variant="text" size="lg">
        {{ t('navigation_menu.blog') }}
        <template #append>
          <RuiIcon name="external-link-line" />
        </template>
      </RuiButton>
    </a>
  </div>
</template>
