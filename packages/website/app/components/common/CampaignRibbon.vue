<script setup lang="ts">
import { formatCampaignLastDay } from '@rotki/card-payment-common/utils/campaign';
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';

const { applied = false } = defineProps<{
  /** The campaign code is already applied to the current checkout. */
  applied?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const { activeCampaign } = useAppConfig();

const lastDay = computed<string | undefined>(() => formatCampaignLastDay(get(activeCampaign)?.periodEnd));
</script>

<template>
  <div
    v-if="activeCampaign"
    class="flex items-center justify-center gap-2 px-4 py-2 text-body-2 text-rui-primary text-center font-medium border-b border-default w-full bg-rui-primary/[0.06]"
  >
    <RuiIcon
      :name="applied ? 'lu-circle-check' : 'lu-tag'"
      size="16"
      class="shrink-0 hidden sm:block"
    />
    <span>
      <i18n-t
        :keypath="applied ? 'campaign.ribbon_applied' : 'campaign.ribbon'"
        scope="global"
      >
        <template #percent>
          {{ activeCampaign.percent }}
        </template>
        <template #code>
          <strong class="font-bold tracking-wide">{{ activeCampaign.code }}</strong>
        </template>
      </i18n-t>
      <template v-if="lastDay && !applied">
        {{ ' ' }}{{ t('campaign.ribbon_last_day', { date: lastDay }) }}
      </template>
    </span>
  </div>
</template>
