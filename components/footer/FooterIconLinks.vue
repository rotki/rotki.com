<script setup lang="ts">
import { RuiButton, RuiIcon } from '@rotki/ui-library';

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
      <a :href="menu.href" rel="noreferrer" target="_blank" :title="menu.title">
        <RuiButton size="lg" variant="text">
          <span class="flex items-center">
            <span v-if="menu.showText" class="mr-4">{{ menu.title }}</span>
            <RuiIcon :name="menu.icon" />
          </span>
        </RuiButton>
      </a>
    </div>
  </div>
</template>
