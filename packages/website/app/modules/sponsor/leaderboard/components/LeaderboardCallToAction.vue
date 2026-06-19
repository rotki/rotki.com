<script lang="ts" setup>
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="text-center mt-6 border-t border-default">
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-1">
        {{ t('sponsor.leaderboard.call_to_action.title') }}
      </h2>
      <p class="text-rui-text-secondary text-sm mb-4">
        {{ t('sponsor.leaderboard.call_to_action.description') }}
      </p>
      <ButtonLink
        variant="outlined"
        to="/sponsor/mint"
        size="lg"
        color="primary"
        class="mx-auto"
      >
        {{ t('sponsor.leaderboard.call_to_action.button') }}
      </ButtonLink>
    </div>
  </div>
</template>
