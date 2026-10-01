<script setup lang="ts">
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

const { t } = useI18n({ useScope: 'global' });

const limits = usePlanLimits();
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-10 md:gap-20">
    <div class="flex-1">
      <img
        class="rounded-xl"
        :alt="t('home.profit_loss_report.title')"
        src="/img/profit_loss_report.webp"
        srcset="/img/profit_loss_report-654w.webp 654w, /img/profit_loss_report-1308w.webp 1308w, /img/profit_loss_report.webp 2400w"
        sizes="(min-width: 640px) min(654px, 50vw), 100vw"
        loading="lazy"
        width="654"
        height="523"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2">
      <p class="text-subtitle-1 font-medium text-rui-primary">
        {{ t('home.profit_loss_report.title') }}
      </p>
      <h3 class="text-h5 !font-bold">
        {{ t('home.profit_loss_report.subtitle') }}
      </h3>
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
            {{ t('home.profit_loss_report.details.free_vs_premium.description', {
              free: limits.free,
              supporter: limits.supporter.pnlEvents,
              basic: limits.basic.pnlEvents,
              advanced: limits.advanced.pnlEvents,
            }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
