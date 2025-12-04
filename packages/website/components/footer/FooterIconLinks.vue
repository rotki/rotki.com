<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import ButtonLink from '~/components/common/ButtonLink.vue';

const {
  public: {
    contact: { emailMailto, twitter, discord, github },
  },
} = useRuntimeConfig();

const menus: { title: string; showText: boolean; href: string; icon: RuiIcons }[] = [
  {
    title: 'Github',
    showText: false,
    href: github,
    icon: 'lu-github',
  },
  {
    title: 'Twitter',
    showText: false,
    href: twitter,
    icon: 'lu-x-twitter',
  },
  {
    title: 'Discord',
    showText: false,
    href: discord,
    icon: 'lu-discord',
  },
  {
    title: 'Contact',
    showText: true,
    href: emailMailto,
    icon: 'lu-mail',
  },
];
</script>

<template>
  <div class="flex flex-wrap items-center space-x-4">
    <div
      v-for="menu in menus"
      :key="menu.title"
    >
      <ButtonLink
        size="lg"
        :to="menu.href"
        :title="menu.title"
        external
      >
        <span class="flex space-x-2 items-center">
          <span v-if="menu.showText">{{ menu.title }}</span>
          <RuiIcon :name="menu.icon" />
        </span>
      </ButtonLink>
    </div>
  </div>
</template>
