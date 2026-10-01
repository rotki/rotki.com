<script setup lang="ts">
import DownloadCallToAction from '~/components/common/DownloadCallToAction.vue';
import DynamicMessageDisplay from '~/components/home/DynamicMessageDisplay.vue';
import FeatureList from '~/components/home/features/FeatureList.vue';
import HomeBanner from '~/components/home/HomeBanner.vue';
import HomeFaq from '~/components/home/HomeFaq.vue';
import McpSpotlight from '~/components/home/McpSpotlight.vue';
import PremiumFeatures from '~/components/home/PremiumFeatures.vue';
import Testimonials from '~/components/home/testimonials/Testimonials.vue';
import WhyRotki from '~/components/home/WhyRotki.vue';
import PricingSection from '~/components/pricings/PricingSection.vue';
import { useDynamicMessages } from '~/composables/use-dynamic-messages';
import { usePageSeo } from '~/composables/use-page-seo';

const { t } = useI18n({ useScope: 'global' });

const title = 'rotki: open source crypto portfolio tracker and tax tool';

const description
  = 'Open source, local-first crypto portfolio tracker. Connect exchanges, wallets and DeFi, decode your history and create profit and loss reports, privately.';

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`;

usePageSeo(title, description, '/', { keywords });
useHead({
  titleTemplate: '',
});

const { public: { baseUrl } } = useRuntimeConfig();
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          'name': 'rotki',
          'url': `${baseUrl}/`,
          'publisher': { '@id': `${baseUrl}/#organization` },
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${baseUrl}/#software`,
          'name': 'rotki',
          'description': description,
          'applicationCategory': 'FinanceApplication',
          'operatingSystem': 'Windows, macOS, Linux',
          'url': `${baseUrl}/`,
          'downloadUrl': `${baseUrl}/download`,
          'screenshot': `${baseUrl}/img/screenshots/1-sc-dashboard.webp`,
          'license': 'https://www.gnu.org/licenses/agpl-3.0.html',
          'isAccessibleForFree': true,
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'EUR',
          },
          'publisher': { '@id': `${baseUrl}/#organization` },
        },
      ],
    }),
  }],
});

const { fetchMessages, activeDashboardMessages } = useDynamicMessages();

onBeforeMount(() => {
  fetchMessages();
});

definePageMeta({
  landing: true,
});
</script>

<template>
  <DynamicMessageDisplay
    v-if="activeDashboardMessages.length > 0"
    :messages="activeDashboardMessages"
  />
  <HomeBanner />
  <FeatureList />
  <WhyRotki />
  <McpSpotlight />
  <Testimonials />
  <PremiumFeatures />
  <section
    id="pricing"
    class="pt-4 scroll-mt-8"
  >
    <div class="container flex flex-col items-center text-center gap-3 mb-14">
      <h2 class="text-h4 !font-bold">
        {{ t('home.pricing.title') }}
      </h2>
      <p class="text-body-1 text-rui-text-secondary max-w-[560px]">
        {{ t('home.pricing.detail') }}
      </p>
    </div>
    <PricingSection compact />
  </section>
  <HomeFaq />
  <DownloadCallToAction />
</template>
