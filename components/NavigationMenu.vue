<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex space-x-4 flex-wrap justify-center">
    <ButtonLink size="lg" to="/" highlight-exact-active>{{
      t('navigation_menu.home')
    }}</ButtonLink>
    <ButtonLink size="lg" to="/#features">
      {{ t('navigation_menu.features') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/download" highlight-exact-active>
      {{ t('navigation_menu.download') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/jobs" highlight-active>
      {{ t('navigation_menu.jobs') }}
    </ButtonLink>
    <ButtonLink v-if="false" size="lg" to="/values">
      {{ t('navigation_menu.values') }}
    </ButtonLink>
    <ButtonLink
      size="lg"
      to="https://rotki.readthedocs.io/en/latest/index.html"
      external
    >
      <span> {{ t('navigation_menu.documentation') }} </span>
      <template #append>
        <RuiIcon size="18" name="external-link-line" />
      </template>
    </ButtonLink>
    <ButtonLink size="lg" to="https://blog.rotki.com" external>
      <span> {{ t('navigation_menu.blog') }} </span>
      <template #append>
        <RuiIcon size="18" name="external-link-line" />
      </template>
    </ButtonLink>
  </div>
</template>
