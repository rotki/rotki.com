<script setup lang="ts">
const { t } = useI18n();

interface MenuItem {
  label: string;
  to: string;
  external?: true;
  highlightExactActive?: true;
  highlightActive?: true;
}

interface MenuGroup {
  header: string;
  items: MenuItem[];
}

const menus: MenuGroup[] = [
  {
    header: t('navigation_menu.product'),
    items: [
      {
        label: t('navigation_menu.home'),
        to: '/',
        highlightExactActive: true,
      },
      {
        label: t('navigation_menu.premium_features'),
        to: '/products',
        highlightActive: true,
      },
      {
        label: t('navigation_menu.integration.title'),
        to: '/integrations',
        highlightActive: true,
      },
    ],
  },
  {
    header: t('navigation_menu.company'),
    items: [
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
    ],
  },
  {
    header: t('navigation_menu.resources'),
    items: [
      {
        label: t('navigation_menu.documentation.title'),
        to: 'https://docs.rotki.com',
        external: true,
      },
      {
        label: t('navigation_menu.blog.title'),
        to: 'https://blog.rotki.com',
        external: true,
      },
    ],
  },
  {
    header: t('navigation_menu.legal'),
    items: [
      {
        label: t('navigation_menu.impressum'),
        to: '/impressum',
        highlightActive: true,
      },
      {
        label: t('navigation_menu.privacy_policy'),
        to: '/privacy-policy',
        highlightActive: true,
      },
      {
        label: t('navigation_menu.tos'),
        to: '/tos',
        highlightActive: true,
      },
      {
        label: t('navigation_menu.faq'),
        to: 'https://docs.rotki.com/faq',
        external: true,
      },
    ],
  },
];
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 gap-y-8">
    <div
      v-for="item in menus"
      :key="item.header"
      class="flex flex-col gap-4"
    >
      <div class="text-body-1 font-bold text-rui-text-secondary">
        {{ item.header }}
      </div>
      <div>
        <div
          v-for="menu in item.items"
          :key="menu.label"
        >
          <ButtonLink
            size="lg"
            :to="menu.to"
            :highlight-active="menu.highlightActive"
            :highlight-exact-active="menu.highlightExactActive"
            :external="menu.external"
          >
            {{ menu.label }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
