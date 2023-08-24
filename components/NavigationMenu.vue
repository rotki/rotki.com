<script setup lang="ts">
const { t } = useI18n();

interface Menu {
  label: string;
  to: string;
  highlightExactActive?: true;
  highlightActive?: true;
  external?: true;
}

const menus: Menu[] = [
  {
    label: t('navigation_menu.home'),
    to: '/',
    highlightExactActive: true,
  },
  {
    label: t('navigation_menu.features'),
    to: '/#features',
  },
  {
    label: t('navigation_menu.download'),
    to: '/download',
    highlightExactActive: true,
  },
  {
    label: t('navigation_menu.jobs'),
    to: '/jobs',
    highlightActive: true,
  },
  {
    label: t('navigation_menu.values'),
    to: '/values',
    highlightActive: true,
  },
  {
    label: t('navigation_menu.documentation'),
    to: 'https://rotki.readthedocs.io/en/latest/index.html',
    external: true,
  },
  {
    label: t('navigation_menu.blog'),
    to: 'https://blog.rotki.com',
    external: true,
  },
];
</script>

<template>
  <div
    class="flex flex-wrap md:justify-center md:gap-x-1 lg:gap-x-2 xl:gap-x-4"
  >
    <ButtonLink
      v-for="menu in menus"
      :key="menu.label"
      class="w-full justify-start"
      :highlight-active="menu.highlightActive"
      :highlight-exact-active="menu.highlightExactActive"
      :external="menu.external"
      :to="menu.to"
    >
      <span> {{ menu.label }} </span>
      <template v-if="menu.external" #append>
        <RuiIcon size="18" name="external-link-line" />
      </template>
    </ButtonLink>
  </div>
</template>
