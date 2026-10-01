<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });

const questions: string[] = [
  t('home.mcp.questions.gas'),
  t('home.mcp.questions.protocols'),
  t('home.mcp.questions.holdings'),
];

const modes: { icon: RuiIcons; title: string; description: string; isDefault?: boolean }[] = [
  {
    icon: 'lu-shield-check',
    title: t('home.mcp.modes.strict.title'),
    description: t('home.mcp.modes.strict.description'),
  },
  {
    icon: 'lu-shield-half',
    title: t('home.mcp.modes.balanced.title'),
    description: t('home.mcp.modes.balanced.description'),
    isDefault: true,
  },
  {
    icon: 'lu-shield-off',
    title: t('home.mcp.modes.raw.title'),
    description: t('home.mcp.modes.raw.description'),
  },
];
</script>

<template>
  <section class="py-16 md:py-24 bg-rui-primary/[0.04]">
    <div class="container grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-rui-primary text-white px-3 py-1 text-caption font-medium">
            {{ t('home.mcp.badge') }}
          </span>
          <span class="rounded-full bg-rui-primary/[0.08] px-3 py-1 text-caption font-medium text-rui-primary">
            {{ t('home.premium_features.basic_and_up') }}
          </span>
        </div>
        <h2 class="text-h4 !font-bold">
          {{ t('home.mcp.title') }}
        </h2>
        <p class="text-body-1 text-rui-text-secondary">
          {{ t('home.mcp.detail') }}
        </p>
        <ul class="flex flex-col gap-2">
          <li
            v-for="question in questions"
            :key="question"
            class="flex items-start gap-3 rounded-xl border border-rui-grey-200 bg-white px-4 py-3 text-body-2"
          >
            <RuiIcon
              name="lu-message-circle"
              size="18"
              class="text-rui-primary mt-0.5 shrink-0"
            />
            {{ question }}
          </li>
        </ul>
        <div class="flex flex-wrap gap-3 pt-1">
          <ButtonLink
            to="/features/ai-assistant-mcp"
            color="primary"
            variant="default"
            rounded
          >
            {{ t('home.mcp.learn_more') }}
          </ButtonLink>
          <ButtonLink
            to="https://docs.rotki.com/usage-guides/mcp.html"
            external
            color="primary"
            variant="outlined"
            rounded
          >
            {{ t('home.mcp.setup_guide') }}
          </ButtonLink>
        </div>
      </div>

      <div class="rounded-2xl border border-rui-grey-200 bg-white p-6 md:p-8 flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h3 class="text-h6">
            {{ t('home.mcp.modes.title') }}
          </h3>
          <p class="text-body-2 text-rui-text-secondary">
            {{ t('home.mcp.modes.detail') }}
          </p>
        </div>
        <ul class="flex flex-col gap-3">
          <li
            v-for="mode in modes"
            :key="mode.title"
            class="flex items-start gap-4 rounded-xl border p-4"
            :class="mode.isDefault ? 'border-rui-primary bg-rui-primary/[0.04]' : 'border-rui-grey-200'"
          >
            <span class="flex items-center justify-center size-10 shrink-0 rounded-lg bg-rui-primary/[0.08] text-rui-primary">
              <RuiIcon :name="mode.icon" />
            </span>
            <div class="flex flex-col gap-1">
              <span class="flex items-center gap-2 text-subtitle-1 font-medium">
                {{ mode.title }}
                <span
                  v-if="mode.isDefault"
                  class="rounded-full bg-rui-primary text-white px-2 py-0.5 text-caption"
                >
                  {{ t('home.mcp.modes.default') }}
                </span>
              </span>
              <span class="text-body-2 text-rui-text-secondary">
                {{ mode.description }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
