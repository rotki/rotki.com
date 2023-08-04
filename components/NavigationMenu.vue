<script setup lang="ts">
const { t } = useI18n();

const buttonClasses = 'w-full justify-start';
</script>

<template>
  <div
    class="flex flex-wrap md:justify-center md:gap-x-1 lg:gap-x-2 xl:gap-x-4"
  >
    <ButtonLink :class="buttonClasses" size="lg" to="/" highlight-exact-active>
      {{ t('navigation_menu.home') }}
    </ButtonLink>
    <ButtonLink :class="buttonClasses" size="lg" to="/#features">
      {{ t('navigation_menu.features') }}
    </ButtonLink>
    <ButtonLink
      :class="buttonClasses"
      size="lg"
      to="/download"
      highlight-exact-active
    >
      {{ t('navigation_menu.download') }}
    </ButtonLink>
    <ButtonLink :class="buttonClasses" size="lg" to="/jobs" highlight-active>
      {{ t('navigation_menu.jobs') }}
    </ButtonLink>
    <ButtonLink v-if="false" :class="buttonClasses" size="lg" to="/values">
      {{ t('navigation_menu.values') }}
    </ButtonLink>
    <ButtonLink
      :class="buttonClasses"
      size="lg"
      to="https://rotki.readthedocs.io/en/latest/index.html"
      external
    >
      <span> {{ t('navigation_menu.documentation') }} </span>
      <template #append>
        <RuiIcon size="18" name="external-link-line" />
      </template>
    </ButtonLink>
    <ButtonLink
      :class="buttonClasses"
      size="lg"
      to="https://blog.rotki.com"
      external
    >
      <span> {{ t('navigation_menu.blog') }} </span>
      <template #append>
        <RuiIcon size="18" name="external-link-line" />
      </template>
    </ButtonLink>
  </div>
</template>
