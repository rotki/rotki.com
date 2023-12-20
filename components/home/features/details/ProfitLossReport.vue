<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-10 md:gap-20">
    <div class="sm:w-2/5">
      <img
        class="rounded-xl overflow-hidden"
        :alt="t('home.profit_loss_report.title')"
        src="/img/dashboard-2.jpg"
      />
    </div>
    <div class="flex flex-1 flex-col gap-4">
      <h5 class="text-h5 text-rui-primary">
        {{ t('home.profit_loss_report.title') }}
      </h5>
      <h6 class="text-h6">{{ t('home.profit_loss_report.subtitle') }}</h6>
      <div
        class="text-body-1 text-rui-text-secondary whitespace-break-spaces pt-2"
      >
        {{ t('home.profit_loss_report.detail') }}
      </div>
    </div>
  </div>
</template>
