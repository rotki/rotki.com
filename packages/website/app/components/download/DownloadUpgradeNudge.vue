<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';

const { t } = useI18n({ useScope: 'global' });
const { chronicle } = useSigilEvents();
</script>

<template>
  <div class="bg-rui-primary/[0.06] py-6 lg:py-8">
    <div class="container">
      <div class="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
        <div class="flex-1">
          <h4 class="text-rui-light-primary text-h6 font-medium mb-3">
            {{ t('download.upgrade_nudge.title') }}
          </h4>
          <ul class="text-rui-text-secondary text-body-1 space-y-2">
            <li class="flex items-start gap-2">
              <span class="text-rui-success">✓</span>
              <span>{{ t('download.upgrade_nudge.bullet_1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-rui-success">✓</span>
              <span>{{ t('download.upgrade_nudge.bullet_2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-rui-success">✓</span>
              <span>{{ t('download.upgrade_nudge.bullet_3') }}</span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col items-start lg:items-end gap-3">
          <div class="flex flex-wrap gap-3">
            <ButtonLink
              to="/checkout/pay"
              color="primary"
              variant="default"
              data-cy="see-plans-button"
              @click="chronicle('download_see_plans_click', { source: 'download_page_nudge' })"
            >
              {{ t('download.upgrade_nudge.see_plans') }}
            </ButtonLink>
            <ButtonLink
              to="/products"
              color="primary"
              variant="outlined"
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
