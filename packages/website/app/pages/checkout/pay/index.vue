<script lang="ts" setup>
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import ButtonLink from '~/components/common/ButtonLink.vue';
import PricingFeatureItem from '~/components/pricings/PricingFeatureItem.vue';
import PricingHeading from '~/components/pricings/PricingHeading.vue';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import PricingTierComparisonSkeleton from '~/components/pricings/PricingTierComparisonSkeleton.vue';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';
import { useCountries } from '~/composables/use-countries';
import { useMainStore } from '~/store';
import { PricingPeriod } from '~/types/tiers';
import { getCountryName } from '~/utils/countries';
import { commonAttrs, getMetadata } from '~/utils/metadata';

// Route constants
const ROUTES = {
  LOGIN: '/login',
} as const;

const title = 'rotki pricing';
const description = 'Pricing page for rotki subscription';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/checkout/pay/`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
  middleware: ['maintenance'],
});

const { t } = useI18n({ useScope: 'global' });

const selectedPricingPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const mainStore = useMainStore();
const { account } = storeToRefs(mainStore);
const { availablePlans, country } = useAvailablePlans();
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

      <PricingTierComparisonSkeleton v-if="availablePlans.length === 0" />
      <PricingTierComparison
        v-else
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
          v-if="!account"
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
