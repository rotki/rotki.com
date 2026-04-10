<script lang="ts" setup>
import { SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import ButtonLink from '~/components/common/ButtonLink.vue';
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

usePageSeo(
  'Pricing',
  'Compare rotki premium plans — encrypted backups, multi-device sync, ETH staking tracking, detailed graphs, and more. Starting free.',
  '/checkout/pay',
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
      'url': `${baseUrl}/checkout/pay`,
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
      },
    }),
  }],
});

definePageMeta({
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
  <div class="flex flex-col max-w-full mx-4 md:mx-8">
    <PricingHeading />

    <!-- Top Section: Pricing Cards -->
    <div class="flex flex-col gap-8 pb-10 md:pb-16 mt-6">
      <PricingPeriodTab
        v-model="selectedPricingPeriod"
        :data="availablePlans"
      />

      <PricingTierComparison
        :selected-period="selectedPricingPeriod"
        :available-plans="availablePlans"
        :tiers-data="tiersInformation"
      />

      <div class="max-w-[42rem] mx-auto flex flex-col gap-6 mt-4">
        <div class="flex flex-col gap-3">
          <PricingFeatureItem
            v-for="(line, i) in planNotes"
            :key="i"
          >
            {{ line }}
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
                <ButtonLink
                  :to="ROUTES.LOGIN"
                  inline
                  color="primary"
                >
                  {{ t('auth.login.title') }}
                </ButtonLink>
              </template>
            </i18n-t>
            <i18n-t
              v-else
              keypath="home.plans.login_to_show_prices"
              scope="global"
              tag="div"
            >
              <template #login>
                <ButtonLink
                  :to="ROUTES.LOGIN"
                  inline
                  color="primary"
                >
                  {{ t('auth.login.title') }}
                </ButtonLink>
              </template>
            </i18n-t>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
