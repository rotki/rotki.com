<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const {
  public: {
    contact: { bespokeEmail, bespokeEmailMailTo, twitter },
  },
} = useRuntimeConfig();

const title = 'Bespoke Accounting Service';

useHead({
  title,
  meta: getMetadata(title, 'rotki bespoke accounting service - Deep expertise in crypto accounting since 2017', '/bespoke'),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});

const { t } = useI18n({ useScope: 'global' });

const services = computed(() => [
  {
    icon: 'lu-user-cog',
    title: t('accounting.services.tailored.title'),
    description: t('accounting.services.tailored.description'),
  },
  {
    icon: 'lu-scroll-text',
    title: t('accounting.services.scripts.title'),
    description: t('accounting.services.scripts.description'),
  },
  {
    icon: 'lu-handshake',
    title: t('accounting.services.hands_on.title'),
    description: t('accounting.services.hands_on.description'),
  },
  {
    icon: 'lu-eye-off',
    title: t('accounting.services.privacy.title'),
    description: t('accounting.services.privacy.description'),
  },
]);
</script>

<template>
  <div class="py-12 md:py-20">
    <div class="container mx-auto max-w-5xl">
      <div class="text-center mb-10 md:mb-16">
        <h1 class="text-h4 mb-5">
          {{ t('accounting.title') }}
        </h1>
        <i18n-t
          tag="div"
          class="text-xl md:text-xl mx-auto text-rui-text-secondary text-justify"
          keypath="accounting.intro"
          scope="global"
        >
          <template #twitter>
            <ButtonLink
              color="primary"
              inline
              external
              :to="twitter"
            >
              @RotkiApp
            </ButtonLink>
          </template>
        </i18n-t>
      </div>

      <div class="grid md:grid-cols-2 gap-3 md:gap-6 mb-16">
        <div
          v-for="service in services"
          :key="service.title"
          class="flex gap-4 p-4 md:p-6 rounded-xl bg-rui-grey-100"
        >
          <div class="p-3 rounded-lg bg-rui-primary text-white h-fit">
            <RuiIcon
              :name="service.icon"
              size="24"
            />
          </div>
          <div class="flex flex-col gap-1">
            <h5 class="font-semibold">
              {{ service.title }}
            </h5>
            <p class="text-rui-text-secondary text-sm text-justify">
              {{ service.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-xl overflow-hidden shadow-xl">
        <NuxtImg
          src="/img/accounting.webp"
          :alt="t('accounting.title')"
          class="w-full h-auto"
          format="webp"
          loading="lazy"
          width="896"
          height="504"
        />
      </div>
    </div>
  </div>
  <div class="bg-rui-primary text-rui-dark-text py-12 md:py-20">
    <div class="container max-w-5xl">
      <div class="mb-8 text-center">
        <h4 class="text-h4 font-bold mb-4">
          {{ t('accounting.formalization.title') }}
        </h4>

        <p class="text-sm text-white/[0.8]">
          {{ t('accounting.formalization.description') }}
        </p>
      </div>

      <div class="flex flex-col items-center space-y-4 dark">
        <ButtonLink
          external
          to="https://calendly.com/rotki-lefteris/accounting-with-rotki"
          size="lg"
          variant="filled"
          rounded
        >
          <template #prepend>
            <RuiIcon
              name="lu-calendar"
              size="20"
            />
          </template>
          Book a Free 15-Min Intro call
        </ButtonLink>

        <i18n-t
          tag="div"
          class="font-bold dark text-sm"
          keypath="accounting.contact.message"
          scope="global"
        >
          <template #email>
            <ButtonLink
              class="underline !text-white"
              inline
              external
              :to="bespokeEmailMailTo"
            >
              {{ bespokeEmail }}
            </ButtonLink>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>

  <div class="py-12 md:py-20 bg-rui-grey-50">
    <div class="container mx-auto max-w-5xl">
      <div class="text-center mb-6 md:mb-10">
        <h2 class="text-h4 font-bold mb-6">
          {{ t('accounting.pricing.title') }}
        </h2>
        <p class="text-lg text-rui-text-secondary max-w-3xl mx-auto">
          {{ t('accounting.pricing.intro') }}
        </p>
      </div>

      <div class="bg-white rounded-xl p-4 md:p-6 shadow-xl border-2 border-rui-primary mb-10 max-w-2xl mx-auto">
        <div class="text-center">
          <h3 class="text-2xl font-bold mb-0.5">
            {{ t('accounting.pricing.initial_consultation.title') }}
          </h3>
          <div class="mb-6">
            <span class="text-2xl font-bold text-rui-primary">{{ t('accounting.pricing.initial_consultation.price') }}</span>
            <span class="text-xl text-rui-text-secondary">{{ t('accounting.pricing.initial_consultation.per_hour') }}</span>
            <span class="text-xs text-rui-text-secondary ml-2">{{ t('accounting.pricing.initial_consultation.excluding_vat') }}</span>
          </div>
          <p class="text-rui-text-secondary mx-auto whitespace-break-spaces text-justify">
            {{ t('accounting.pricing.initial_consultation.description') }}
          </p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-rui-grey-100 rounded-xl p-6">
          <h4 class="text-lg font-semibold mb-3">
            {{ t('accounting.pricing.custom_quote.title') }}
          </h4>
          <p class="text-rui-text-secondary text-sm text-justify">
            {{ t('accounting.pricing.custom_quote.description') }}
          </p>
        </div>

        <div class="bg-rui-grey-100 rounded-xl p-6">
          <h4 class="text-lg font-semibold mb-3">
            {{ t('accounting.pricing.transparent_fair.title') }}
          </h4>
          <p class="text-rui-text-secondary text-sm text-justify">
            {{ t('accounting.pricing.transparent_fair.description') }}
          </p>
        </div>
      </div>
      <RuiAlert
        class="mt-8 text-justify"
        type="warning"
        :title="t('accounting.important_note.title')"
      >
        {{ t('accounting.important_note.paragraph1') }}
        {{ t('accounting.important_note.paragraph2') }}
      </RuiAlert>
    </div>
  </div>
</template>
