<script setup lang="ts">
import { commonAttrs } from '~/utils/metadata';

const {
  public: {
    contact: { emailMailto, twitter, email },
  },
} = useRuntimeConfig();

useHead({
  title: 'Bespoke Accounting Service',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'rotki bespoke accounting service - Deep expertise in crypto accounting since 2017',
    },
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});

const { t } = useI18n({ useScope: 'global' });

const services = computed(() => [
  {
    icon: 'lu-clock',
    title: t('accounting.services.historical_balances.title'),
    description: t('accounting.services.historical_balances.description'),
  },
  {
    icon: 'lu-binary',
    title: t('accounting.services.transaction_decoding.title'),
    description: t('accounting.services.transaction_decoding.description'),
  },
  {
    icon: 'lu-calculator',
    title: t('accounting.services.cost_basis_pnl.title'),
    description: t('accounting.services.cost_basis_pnl.description'),
  },
  {
    icon: 'lu-puzzle',
    title: t('accounting.services.complex_situations.title'),
    description: t('accounting.services.complex_situations.description'),
  },
]);
</script>

<template>
  <div class="container mx-auto px-4 py-16 max-w-6xl">
    <div class="text-center mb-10 md:mb-16">
      <h1 class="text-h4 mb-5">
        {{ t('accounting.title') }}
      </h1>
      <i18n-t
        tag="div"
        class="text-xl md:text-xl mx-auto text-rui-text-secondary"
        keypath="accounting.intro"
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
        class="flex gap-4 p-6 rounded-xl bg-gradient-to-b from-transparent to-rui-primary/[0.05]"
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
          <p class="text-rui-text-secondary text-sm">
            {{ service.description }}
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-xl overflow-hidden shadow-xl">
      <img
        src="/img/accounting.webp"
        :alt="t('accounting.title')"
        class="w-full h-auto"
      />
    </div>

    <div class="bg-rui-primary/5 dark:bg-rui-primary/10 rounded-2xl p-6 md:p-8 text-center mt-12">
      <div class="mb-6">
        <h4 class="text-h4 font-bold mb-4">
          {{ t('accounting.formalization.title') }}
        </h4>

        <p class="font-bold">
          {{ t('accounting.formalization.description') }}
        </p>
      </div>

      <div class="max-w-sm mx-auto">
        <p class="mb-4 text-rui-text-secondary text-sm">
          {{ t('accounting.contact.message') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <ButtonLink
            :to="emailMailto"
            size="sm"
            variant="default"
            color="primary"
          >
            <template #prepend>
              <RuiIcon name="lu-mail" />
            </template>
            {{ t('accounting.contact.email_button', { email }) }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
