<script lang="ts" setup>
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="text-center py-12">
    <img
      :alt="t('sponsor.leaderboard.empty_state')"
      class="w-24 mx-auto"
      src="/img/no_data_placeholder.svg"
      width="96"
      height="96"
      loading="lazy"
    />
    <p class="text-rui-text-secondary">
      {{ t('sponsor.leaderboard.empty_state') }}
    </p>
    <i18n-t
      keypath="sponsor.leaderboard.be_the_first"
      scope="global"
    >
      <template #mint>
        <ButtonLink
          color="primary"
          inline
          to="/sponsor/mint"
        >
          {{ t('sponsor.leaderboard.mint') }}
        </ButtonLink>
      </template>
    </i18n-t>
  </div>
</template>
