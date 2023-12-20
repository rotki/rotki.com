<script setup lang="ts">
const model = ref(0);

const { t } = useI18n();

const data = [
  {
    title: t('home.dashboard.title'),
    subtitle: t('home.dashboard.subtitle'),
  },
  {
    title: t('home.exchanges.title'),
    subtitle: t('home.exchanges.subtitle'),
  },
  {
    title: t('home.defi.title'),
    subtitle: t('home.defi.subtitle'),
  },
  {
    title: t('home.eth_protocols.title'),
    subtitle: t('home.eth_protocols.subtitle'),
  },
  {
    title: t('home.profit_loss_report.title'),
    subtitle: t('home.profit_loss_report.subtitle'),
  },
];

const [DefineTab, ReuseTab] = createReusableTemplate<{
  title: string;
  subtitle: string;
  active: boolean;
  index: number;
}>();
</script>

<template>
  <DefineTab #default="{ title, subtitle, active, index }">
    <div
      class="flex-1 flex items-center lg:items-start transition-all lg:flex-col gap-2 lg:gap-4 rounded-xl cursor-pointer px-4 py-2 lg:px-6 lg:py-8 whitespace-nowrap lg:whitespace-normal"
      :class="{
        'bg-rui-primary text-white': active,
        'bg-white text-rui-text': !active,
      }"
      @click="model = index"
    >
      <div
        class="shrink-0 w-6 h-6 lg:w-12 lg:h-12 rounded-full transition-all border-[0.375rem] lg:border-[0.75rem] border-rui-primary-lighter"
        :class="{
          'opacity-20': !active,
          'opacity-60': active,
        }"
      />
      <h6 class="text-h6 mt-1">
        {{ title }}
      </h6>
      <div class="text-body-1 opacity-70 hidden lg:block">
        {{ subtitle }}
      </div>
    </div>
  </DefineTab>
  <div id="features" class="py-16 md:py-20 bg-[#f9f9f9]">
    <div class="container">
      <div class="pb-16 md:pb-20">
        <i18n-t class="text-h4 mb-10" tag="h4" keypath="home.rotki_offer">
          <span class="text-rui-primary">rotki</span>
        </i18n-t>
        <div
          class="flex gap-4 overflow-x-auto lg:overflow-x-hidden no-scrollbar"
        >
          <ReuseTab
            v-for="(item, index) in data"
            :key="item.title"
            :title="item.title"
            :subtitle="item.subtitle"
            :index="index"
            :active="index === model"
          />
        </div>
      </div>
      <RuiTabItems v-model="model">
        <RuiTabItem eager><AppDashboard /></RuiTabItem>
        <RuiTabItem eager><SupportedExchangeDetails /></RuiTabItem>
        <RuiTabItem eager><DefiProtocols /></RuiTabItem>
        <RuiTabItem eager><EthProtocols /></RuiTabItem>
        <RuiTabItem eager><ProfitLossReport /></RuiTabItem>
      </RuiTabItems>
    </div>
  </div>
</template>
