<script setup lang="ts">
const {
  public: {
    contact: { emailMailto, twitter, discord, github },
  },
} = useRuntimeConfig();

const menus = [
  {
    title: 'Github',
    showText: false,
    href: github,
    icon: 'github-line',
  },
  {
    title: 'Twitter',
    showText: false,
    href: twitter,
    icon: 'twitter-x-line',
  },
  {
    title: 'Discord',
    showText: false,
    href: discord,
    icon: 'discord-line',
  },
  {
    title: 'Contact',
    showText: true,
    href: emailMailto,
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
