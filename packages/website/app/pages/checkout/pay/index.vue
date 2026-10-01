<script lang="ts" setup>
import { SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import PricingFeatureItem from '~/components/pricings/PricingFeatureItem.vue';
import PricingHeading from '~/components/pricings/PricingHeading.vue';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';
import { useCountries } from '~/composables/use-countries';
import { usePageSeo } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';
import { PricingPeriod } from '~/types/tiers';
import { getCountryName } from '~/utils/countries';

// Route constants
const ROUTES = {
  LOGIN: '/login',
} as const;

const { public: { baseUrl } } = useRuntimeConfig();

// Served at /pricing (canonical, linked from the nav) and /checkout/pay (checkout step 1); see the alias below
usePageSeo(
  'Pricing',
  'Compare rotki premium plans: encrypted backups, multi-device sync, ETH staking tracking, detailed graphs, and more. Starting free.',
  '/pricing',
);

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'rotki',
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Windows, macOS, Linux',
      'url': `${baseUrl}/pricing`,
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
      },
    }),
  }],
});

definePageMeta({
  // Same page under a marketing URL instead of a redirect; the canonical points at /pricing
  alias: ['/pricing'],
  backendRequired: true,
  landing: true,
});

const { t } = useI18n({ useScope: 'global' });

const selectedPricingPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const mainStore = useMainStore();
const { account } = storeToRefs(mainStore);
const { availablePlans, country, pending: plansPending } = useAvailablePlans();
const { tiersInformation } = usePremiumTiersInfo();
const { countries } = useCountries();

const countryName = computed<string>(
  () => getCountryName(get(country), get(countries)),
);

const planNotes = computed<string[]>(() => {
  const period = get(selectedPricingPeriod) === PricingPeriod.MONTHLY
    ? t('selected_plan_overview.month')
    : t('selected_plan_overview.year');

  return [
    t('home.plans.tiers.step_1.notes.line_1', { period }),
    t('home.plans.tiers.step_1.notes.line_2'),
    t('home.plans.tiers.step_1.notes.line_3'),
    t('home.plans.tiers.step_1.notes.line_4'),
  ];
});

// Track pricing page view
const { chronicle } = useSigilEvents();

onMounted(() => {
  chronicle(SigilEvents.PRICING_VIEW, {
    period: get(selectedPricingPeriod),
  });
});
</script>

<template>
  <!-- No extra margin on phones: the layout container already has the gutter, and the plan tabs need the width -->
  <div class="flex flex-col max-w-full md:mx-8">
    <PricingHeading />

    <!-- Top Section: Pricing Cards -->
    <!-- Extra top space: the "save N months" note sits above the toggle -->
    <div class="flex flex-col gap-8 pb-10 md:pb-16 mt-14 lg:mt-16">
      <PricingPeriodTab
        v-model="selectedPricingPeriod"
        class="self-center"
        :data="availablePlans"
      />

      <PricingTierComparison
        :selected-period="selectedPricingPeriod"
        :available-plans="availablePlans"
        :tiers-data="tiersInformation"
      />

      <div class="w-full max-w-[42rem] mx-auto flex flex-col gap-4 mt-4">
        <!-- The billing terms read as one block instead of a loose list under the table -->
        <div class="flex flex-col gap-3 rounded-2xl border border-rui-grey-200 bg-rui-grey-50 p-5 lg:p-6">
          <h2 class="text-subtitle-1 font-bold text-rui-text">
            {{ t('pricing.page.billing_title') }}
          </h2>
          <PricingFeatureItem
            v-for="(line, i) in planNotes"
            :key="i"
          >
            {{ line }}
          </PricingFeatureItem>
          <PricingFeatureItem>
            <i18n-t
              keypath="home.plans.tiers.step_1.notes.integrations"
              scope="global"
            >
              <template #integrations>
                <NuxtLink
                  to="/integrations"
                  class="text-rui-primary underline hover:no-underline"
                >
                  {{ t('home.plans.tiers.step_1.notes.integrations_link') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </PricingFeatureItem>
        </div>

        <div
          v-if="!account && !plansPending && availablePlans.length > 0"
          class="flex flex-col gap-2"
        >
          <div class="text-sm text-rui-text-secondary">
            <i18n-t
              v-if="country"
              keypath="home.plans.country_prices"
              tag="div"
              scope="global"
            >
              <template #country>
                {{ countryName }}
              </template>
              <template #login>
                <NuxtLink
                  :to="ROUTES.LOGIN"
                  class="text-rui-primary underline hover:no-underline"
                >
                  {{ t('auth.login.title') }}
                </NuxtLink>
              </template>
            </i18n-t>
            <i18n-t
              v-else
              keypath="home.plans.login_to_show_prices"
              scope="global"
              tag="div"
            >
              <template #login>
                <NuxtLink
                  :to="ROUTES.LOGIN"
                  class="text-rui-primary underline hover:no-underline"
                >
                  {{ t('auth.login.title') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
