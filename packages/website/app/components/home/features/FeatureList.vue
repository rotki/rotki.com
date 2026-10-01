<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import ButtonLink from '~/components/common/ButtonLink.vue';
import AppDashboard from '~/components/home/features/details/AppDashboard.vue';
import EvmProtocols from '~/components/home/features/details/EvmProtocols.vue';
import HistoryEvents from '~/components/home/features/details/HistoryEvents.vue';
import ProfitLossReport from '~/components/home/features/details/ProfitLossReport.vue';
import SupportedExchangeDetails from '~/components/home/features/details/SupportedExchangeDetails.vue';

const model = ref<number>(0);

const { t } = useI18n({ useScope: 'global' });

const data = computed<{ icon: RuiIcons; title: string }[]>(() => [
  { icon: 'lu-layout-dashboard', title: t('home.dashboard.title') },
  { icon: 'lu-arrow-left-right', title: t('home.exchanges.title') },
  { icon: 'lu-history', title: t('home.history_events.title') },
  { icon: 'lu-blocks', title: t('home.evm_protocols.title') },
  { icon: 'lu-file-chart-column', title: t('home.profit_loss_report.title') },
]);

const [DefineTab, ReuseTab] = createReusableTemplate<{
  icon: RuiIcons;
  title: string;
  active: boolean;
  index: number;
}>();
</script>

<template>
  <!-- The subtitle is the panel's heading, so the tab itself only names the feature -->
  <DefineTab #default="{ icon, title, active, index }">
    <button
      type="button"
      role="tab"
      :aria-selected="active"
      class="flex-1 flex items-center justify-center gap-2.5 rounded-xl cursor-pointer px-4 py-3 lg:py-4 whitespace-nowrap border transition-all"
      :class="{
        'bg-rui-primary text-white border-rui-primary shadow-lg shadow-rui-primary/20': active,
        'bg-white text-rui-text border-rui-grey-200 hover:border-rui-primary/40': !active,
      }"
      @click="model = index"
    >
      <RuiIcon
        :name="icon"
        size="20"
        :class="active ? 'text-white' : 'text-rui-primary'"
      />
      <span class="text-subtitle-1 font-medium">
        {{ title }}
      </span>
    </button>
  </DefineTab>
  <section
    id="features"
    class="py-16 md:py-24 bg-rui-grey-50"
  >
    <div class="container">
      <div class="pb-12 md:pb-16">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div class="flex flex-col gap-3 max-w-[640px]">
            <i18n-t
              class="text-h4 !font-bold"
              tag="h2"
              scope="global"
              keypath="home.rotki_offer"
            >
              <span class="text-rui-primary">rotki</span>
            </i18n-t>
            <p class="text-body-1 text-rui-text-secondary">
              {{ t('home.rotki_offer_detail') }}
            </p>
          </div>
          <ButtonLink
            to="/features"
            color="primary"
            class="self-start md:self-auto"
          >
            {{ t('home.explore_features') }}
            <template #append>
              <RuiIcon
                name="lu-arrow-right"
                size="18"
              />
            </template>
          </ButtonLink>
        </div>
        <div
          role="tablist"
          class="flex gap-4 overflow-x-auto lg:overflow-x-hidden no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-2"
        >
          <ReuseTab
            v-for="(item, index) in data"
            :key="item.title"
            :icon="item.icon"
            :title="item.title"
            :index="index"
            :active="index === model"
          />
        </div>
      </div>
      <RuiTabItems
        v-model="model"
        class="min-h-[674px] sm:min-h-[344px] lg:min-h-[333px] xl:min-h-[429px]"
      >
        <RuiTabItem eager>
          <AppDashboard />
        </RuiTabItem>
        <RuiTabItem>
          <SupportedExchangeDetails />
        </RuiTabItem>
        <RuiTabItem>
          <HistoryEvents />
        </RuiTabItem>
        <RuiTabItem>
          <EvmProtocols />
        </RuiTabItem>
        <RuiTabItem>
          <ProfitLossReport />
        </RuiTabItem>
      </RuiTabItems>
    </div>
  </section>
</template>
