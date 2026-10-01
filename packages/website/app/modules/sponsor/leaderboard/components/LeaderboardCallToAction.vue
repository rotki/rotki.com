<script lang="ts" setup>
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="mt-12 rounded-2xl border border-rui-primary/20 bg-rui-primary/[0.04] px-6 py-8 lg:px-10 text-center flex flex-col items-center gap-3">
    <h2 class="text-h5 !font-bold text-rui-text">
      {{ t('sponsor.leaderboard.call_to_action.title') }}
    </h2>
    <p class="text-body-1 text-rui-text-secondary max-w-md text-balance">
      {{ t('sponsor.leaderboard.call_to_action.description') }}
    </p>
    <ButtonLink
      to="/sponsor/mint"
      color="primary"
      variant="default"
      rounded
      class="mt-2"
    >
      {{ t('sponsor.leaderboard.call_to_action.button') }}
      <template #append>
        <RuiIcon
          name="lu-arrow-right"
          size="16"
        />
      </template>
    </ButtonLink>
  </div>
</template>
