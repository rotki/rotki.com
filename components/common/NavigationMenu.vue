<script setup lang="ts">
const { t } = useI18n();

interface Menu {
  label: string;
  description?: string;
  to: string;
  highlightExactActive?: true;
  highlightActive?: true;
  external?: true;
}

interface MenuParent {
  label: string;
  children?: Menu[];
}

function isParent(item: Menu | MenuParent): item is MenuParent {
  return 'children' in item;
}

const menus: (Menu | MenuParent)[] = [
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
    description: t('navigation_menu.integration.description'),
    to: '/integrations',
  },
  {
    label: t('navigation_menu.download'),
    to: '/download',
    highlightExactActive: true,
  },
  {
    label: t('navigation_menu.resources'),
    children: [
      {
        label: t('navigation_menu.documentation.title'),
        description: t('navigation_menu.documentation.description'),
        to: 'https://docs.rotki.com',
        external: true,
      },
      {
        label: t('navigation_menu.blog.title'),
        description: t('navigation_menu.blog.description'),
        to: 'https://blog.rotki.com',
        external: true,
      },
    ],
  },
];

const { isMdAndDown } = useBreakpoint();
</script>

<template>
  <div
    class="flex flex-wrap md:justify-center md:gap-x-1 lg:gap-x-2 xl:gap-x-4"
  >
    <template v-for="menu in menus">
      <ButtonLink
        v-if="!isParent(menu)"
        :key="menu.label"
        class="w-full justify-start"
        :highlight-active="menu.highlightActive"
        :highlight-exact-active="menu.highlightExactActive"
        :external="menu.external"
        :to="menu.to"
      >
        {{ menu.label }}
        <template
          v-if="menu.external"
          #append
        >
          <RuiIcon
            size="18"
            name="external-link-line"
          />
        </template>
      </ButtonLink>
      <template v-else-if="!isMdAndDown">
        <RuiMenu
          :key="menu.label"
          close-on-content-click
          wrapper-class="w-full"
        >
          <template #activator="{ attrs }">
            <RuiButton
              variant="text"
              class="w-full justify-start"
              v-bind="attrs"
            >
              <div class="flex items-center gap-2">
                {{ menu.label }}
                <RuiIcon
                  name="arrow-down-s-line"
                  size="16"
                />
              </div>
            </RuiButton>
          </template>
          <div class="py-2">
            <ButtonLink
              v-for="child in menu.children"
              :key="child.label"
              variant="list"
              :to="child.to"
              :external="child.external"
            >
              <div class="text-body-2 text-rui-text">
                {{ child.label }}
              </div>
              <div class="text-body-2 text-rui-text-secondary font-normal">
                {{ child.description }}
              </div>
              <template
                v-if="child.external"
                #append
              >
                <RuiIcon
                  class="ml-8"
                  name="external-link-line"
                />
              </template>
            </ButtonLink>
          </div>
        </RuiMenu>
      </template>
      <template v-else>
        <ButtonLink
          v-for="child in menu.children"
          :key="child.label"
          class="w-full justify-start"
          :external="child.external"
          :to="child.to"
        >
          {{ child.label }}
          <template
            v-if="child.external"
            #append
          >
            <RuiIcon
              size="18"
              name="external-link-line"
            />
          </template>
        </ButtonLink>
      </template>
    </template>
  </div>
</template>
