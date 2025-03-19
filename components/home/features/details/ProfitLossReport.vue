<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-10 md:gap-20">
    <div class="sm:w-2/5">
      <img
        class="rounded-xl overflow-hidden"
        :alt="t('home.profit_loss_report.title')"
        src="/img/profit_loss_report.webp"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.profit_loss_report.title') }}
      </h6>
      <div class="flex flex-col gap-6 text-rui-text-secondary pt-4">
        <div>
          <div class="text-subtitle-1 font-bold">
            {{ t('home.profit_loss_report.details.pnl_explanation.title') }}
          </div>
          <div class="text-body-1">
            {{ t('home.profit_loss_report.details.pnl_explanation.description') }}
          </div>
        </div>
        <div>
          <div class="text-subtitle-1 font-bold">
            {{ t('home.profit_loss_report.details.free_vs_premium.title') }}
          </div>
          <div class="text-body-1">
            {{ t('home.profit_loss_report.details.free_vs_premium.description') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
