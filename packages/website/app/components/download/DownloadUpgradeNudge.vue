<script setup lang="ts">
import { SigilEvents } from '@rotki/sigil';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';

const { t } = useI18n({ useScope: 'global' });
const { chronicle } = useSigilEvents();

const bullets: string[] = [
  t('download.upgrade_nudge.bullet_1'),
  t('download.upgrade_nudge.bullet_2'),
  t('download.upgrade_nudge.bullet_3'),
];

function trackSeePlansClick(): void {
  chronicle(SigilEvents.DOWNLOAD_SEE_PLANS_CLICK, { source: 'download_page_nudge' });
}
</script>

<template>
  <div class="container pt-14 lg:pt-20 pb-6 lg:pb-8">
    <div class="rounded-2xl border border-rui-primary/20 bg-rui-primary/[0.04] p-6 lg:p-10">
      <div class="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
        <div class="flex-1">
          <h2 class="text-rui-text text-h5 !font-bold mb-3">
            {{ t('download.upgrade_nudge.title') }}
          </h2>
          <ul class="text-rui-text-secondary text-body-1 space-y-2">
            <li
              v-for="bullet in bullets"
              :key="bullet"
              class="flex items-start gap-2"
            >
              <RuiIcon
                name="lu-check"
                size="18"
                class="text-rui-success mt-0.5 shrink-0"
              />
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col items-start lg:items-end gap-3">
          <div class="flex flex-wrap gap-3">
            <ButtonLink
              to="/checkout/pay"
              color="primary"
              variant="default"
              rounded
              data-cy="see-plans-button"
              @click="trackSeePlansClick()"
            >
              {{ t('download.upgrade_nudge.see_plans') }}
            </ButtonLink>
            <ButtonLink
              to="/products"
              color="primary"
              variant="outlined"
              rounded
              data-cy="what-do-i-get-button"
            >
              {{ t('download.upgrade_nudge.what_do_i_get') }}
            </ButtonLink>
          </div>
          <p class="text-rui-text-secondary text-body-2">
            {{ t('download.upgrade_nudge.tagline') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
