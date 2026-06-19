<script lang="ts" setup>
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="text-center py-6 mb-6 bg-gradient-to-b from-rui-primary/[0.06] to-transparent rounded-xl">
    <h1 class="text-h4 font-bold mb-2">
      {{ t('sponsor.leaderboard.title') }}
    </h1>
    <p class="text-rui-text-secondary">
      {{ t('sponsor.leaderboard.subtitle') }}
    </p>
  </div>
</template>
