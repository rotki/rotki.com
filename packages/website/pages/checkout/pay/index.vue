<script lang="ts" setup>
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import PricingCard from '~/components/pricings/PricingCard.vue';
import PricingCardSkeleton from '~/components/pricings/PricingCardSkeleton.vue';
import PricingFeatureItem from '~/components/pricings/PricingFeatureItem.vue';
import PricingHeading from '~/components/pricings/PricingHeading.vue';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import { useCountries } from '~/composables/countries';
import { useEnrichedPlans } from '~/composables/use-enriched-plans';
import { useFreePlanFeatures } from '~/composables/use-free-plan-features';
import { useMainStore } from '~/store';
import { useTiersStore } from '~/store/tiers';
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
const comparisonSectionRef = ref<HTMLElement>();

const mainStore = useMainStore();
const tiersStore = useTiersStore();
const { account } = storeToRefs(mainStore);
const { country, availablePlans, tiersInformation } = storeToRefs(tiersStore);
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

const freePlanFeatures = useFreePlanFeatures();
const enrichedPlans = useEnrichedPlans(availablePlans, tiersInformation, freePlanFeatures);

function scrollToComparison(): void {
  const element = get(comparisonSectionRef);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

onBeforeMount(async () => {
  await Promise.all([
    tiersStore.getAvailablePlans(),
    tiersStore.getPremiumTiersInfo(),
  ]);
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

      <div class="flex flex-col lg:flex-row gap-4 w-full max-w-[90rem] mx-auto">
        <template v-if="enrichedPlans.length === 0">
          <!-- Skeleton loaders for all cards -->
          <PricingCardSkeleton
            v-for="i in 4"
            :key="i"
          />
        </template>
        <template v-else>
          <!-- Free Plan Card -->
          <PricingCard
            type="free"
            :period="selectedPricingPeriod"
            :features="freePlanFeatures"
            class="flex-1 min-w-0"
          />

          <!-- Regular Plans Cards -->
          <PricingCard
            v-for="enrichedPlan in enrichedPlans"
            :key="enrichedPlan.plan.tierName"
            type="regular"
            :plan="enrichedPlan.plan"
            :period="selectedPricingPeriod"
            :features="enrichedPlan.features"
            :includes-everything-from="enrichedPlan.includesEverythingFrom"
            class="flex-1 min-w-0"
          />

          <!-- Custom Plan Card -->
          <PricingCard
            type="custom"
            :period="selectedPricingPeriod"
            class="flex-1 min-w-0"
          />
        </template>
      </div>

      <div class="flex justify-center mt-2">
        <RuiButton
          color="primary"
          size="lg"
          variant="outlined"
          @click="scrollToComparison()"
        >
          {{ t('pricing.compare_plans') }}
          <template #append>
            <RuiIcon
              name="lu-arrow-down"
              size="16"
            />
          </template>
        </RuiButton>
      </div>

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

    <!-- Bottom Section: Comparison Table -->
    <div
      ref="comparisonSectionRef"
      class="container border-t border-default flex flex-col gap-12 pt-16 pb-10 md:pb-20"
    >
      <div class="lg:text-center">
        <h2 class="text-h5 md:text-h4 font-bold text-rui-text mb-2">
          {{ t('pricing.compare_all_features') }}
        </h2>
        <p class="text-rui-text-secondary">
          {{ t('pricing.detailed_comparison') }}
        </p>
      </div>
      <div class="flex justify-center">
        <PricingPeriodTab
          v-model="selectedPricingPeriod"
          :data="availablePlans"
        />
      </div>
      <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <PricingTierComparison
          :selected-period="selectedPricingPeriod"
          :available-plans="availablePlans"
          :tiers-data="tiersInformation"
        />
      </div>
    </div>
  </div>
</template>
