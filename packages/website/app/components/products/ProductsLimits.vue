<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

interface LimitImage {
  src: string;
  width: number;
  height: number;
}

interface LimitItem {
  title: string;
  description: string;
  /** Screenshot of the limit in the app; items without one render as an icon card. */
  image?: LimitImage;
  icon?: RuiIcons;
}

const { t } = useI18n({ useScope: 'global' });

const limits = usePlanLimits();

// Image cards come first so each row of the two-column grid holds one kind of card
const data = computed<LimitItem[]>(() => [
  {
    image: { src: '/img/products/history_limits.webp', width: 2236, height: 832 },
    title: t('products.features.limits.history_view.title'),
    description: t('products.features.limits.history_view.description', {
      free: get(limits).free,
      supporter: get(limits).supporter.events,
      basic: get(limits).basic.events,
      advanced: get(limits).advanced.events,
    }),
  },
  {
    image: { src: '/img/products/user_notes_limits.webp', width: 920, height: 436 },
    title: t('products.features.limits.user_notes.title'),
    description: t('products.features.limits.user_notes.description'),
  },
  {
    icon: 'lu-file-chart-column',
    title: t('products.features.limits.profit_loss_report.title'),
    description: t('products.features.limits.profit_loss_report.description', {
      free: get(limits).free,
      supporter: get(limits).supporter.pnlEvents,
      basic: get(limits).basic.pnlEvents,
      advanced: get(limits).advanced.pnlEvents,
    }),
  },
  {
    icon: 'lu-layers',
    title: t('products.features.limits.validators.title'),
    description: t('products.features.limits.validators.description', {
      basic: get(limits).basic.ethStaked,
      advanced: get(limits).advanced.ethStaked,
    }),
  },
]);
</script>

<template>
  <div class="py-14 lg:py-20">
    <div class="container">
      <div class="flex flex-col gap-3 pb-8 lg:pb-12">
        <p class="text-rui-primary text-subtitle-1 font-medium">
          {{ t('products.features.limits.heading') }}
        </p>
        <h2 class="text-h5 lg:text-h4 !font-bold">
          {{ t('products.features.limits.title') }}
        </h2>
      </div>
      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-6"
        >
          <!-- The 1.44 captures have different aspect ratios, so they sit in a fixed frame -->
          <div
            v-if="item.image"
            class="aspect-[616/260] flex items-center justify-center rounded-xl border border-rui-grey-300 bg-rui-grey-50 overflow-hidden p-3"
          >
            <img
              :src="item.image.src"
              :alt="item.title"
              :width="item.image.width"
              :height="item.image.height"
              loading="lazy"
              class="max-h-full w-auto object-contain rounded-lg"
            />
          </div>
          <span
            v-else-if="item.icon"
            class="flex items-center justify-center size-12 rounded-xl bg-rui-primary/[0.08] text-rui-primary"
          >
            <RuiIcon :name="item.icon" />
          </span>
          <div class="flex flex-col gap-3">
            <h3 class="text-h6 xl:text-h5 font-bold">
              {{ item.title }}
            </h3>
            <div class="text-body-1 text-rui-text-secondary">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
