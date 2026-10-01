<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });

const data = [
  {
    img: '/img/products/mcp.webp',
    width: 2012,
    height: 1110,
    title: t('products.features.mcp.title'),
    description: t('products.features.mcp.description'),
    to: '/features/ai-assistant-mcp',
  },
  {
    img: '/img/products/asset_matching.webp',
    width: 2000,
    height: 1339,
    title: t('products.features.asset_matching.title'),
    description: t('products.features.asset_matching.description'),
  },
];
</script>

<template>
  <div class="py-14 lg:py-20">
    <div class="container">
      <div class="flex flex-col gap-3 pb-8 lg:pb-12">
        <p class="text-rui-primary text-subtitle-1 font-medium">
          {{ t('products.features.new_features.heading') }}
        </p>
        <h2 class="text-h5 lg:text-h4 !font-bold">
          {{ t('products.features.new_features.title') }}
        </h2>
      </div>
      <div class="grid md:grid-cols-2 gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <!-- The captures have different aspect ratios, so they sit in a fixed frame -->
          <div class="aspect-[3/2] flex items-center justify-center rounded-xl border border-rui-grey-300 bg-rui-grey-50 overflow-hidden p-3">
            <img
              :src="item.img"
              :alt="item.title"
              :width="item.width"
              :height="item.height"
              loading="lazy"
              class="max-h-full w-auto object-contain rounded-lg"
            />
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-h6 xl:text-h5 font-bold">
                {{ item.title }}
              </h3>
              <span class="rounded-full bg-rui-primary/[0.08] px-2.5 py-0.5 text-caption font-medium text-rui-primary">
                {{ t('home.premium_features.basic_and_up') }}
              </span>
            </div>
            <div class="text-rui-text-secondary text-body-1">
              {{ item.description }}
            </div>
            <ButtonLink
              v-if="item.to"
              :to="item.to"
              color="primary"
              class="self-start -ml-3"
            >
              {{ t('home.mcp.learn_more') }}
              <template #append>
                <RuiIcon
                  name="lu-arrow-right"
                  size="18"
                />
              </template>
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
