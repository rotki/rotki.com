<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-10 md:gap-20">
    <div class="flex-1">
      <NuxtImg
        class="rounded-xl overflow-hidden"
        :alt="t('home.dashboard.title')"
        src="/img/dashboard.webp"
        format="webp"
        loading="lazy"
        width="654"
        height="523"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.dashboard.title') }}
      </h6>
      <h6 class="text-h6">
        {{ t('home.dashboard.subtitle') }}
      </h6>
      <div class="flex flex-col gap-6 text-rui-text-secondary pt-4">
        <div>
          <div class="text-subtitle-1 font-bold">
            {{ t('home.dashboard.details.asset_and_liabilities.title') }}
          </div>
          <div class="text-body-1">
            {{ t('home.dashboard.details.asset_and_liabilities.description') }}
          </div>
        </div>
        <div>
          <div class="text-subtitle-1 font-bold">
            {{ t('home.dashboard.details.net_worth_over_time.title') }}
          </div>
          <div class="text-body-1">
            {{ t('home.dashboard.details.net_worth_over_time.description') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
