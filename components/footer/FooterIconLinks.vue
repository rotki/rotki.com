<script setup lang="ts">
import { RuiIcon } from '@rotki/ui-library';

const menus = [
  {
    title: 'Github',
    showText: false,
    href: 'https://github.com/rotki',
    icon: 'github-line',
  },
  {
    title: 'Twitter',
    showText: false,
    href: 'https://twitter.com/rotkiapp',
    icon: 'twitter-line',
  },
  {
    title: 'Discord',
    showText: false,
    href: 'https://discord.gg/aGCxHG7',
    icon: 'discord-line',
  },
  {
    title: 'Contact',
    showText: true,
    href: 'mailto:info@rotki.com',
    icon: 'mail-send-line',
  },
];
</script>

<template>
  <div class="flex flex-wrap items-center space-x-4">
    <div v-for="menu in menus" :key="menu.title">
      <ButtonLink size="lg" :to="menu.href" :title="menu.title" external>
        <span class="flex space-x-2 items-center">
          <span v-if="menu.showText">{{ menu.title }}</span>
          <RuiIcon :name="menu.icon" />
        </span>
      </ButtonLink>
    </div>
  </div>
</template>
