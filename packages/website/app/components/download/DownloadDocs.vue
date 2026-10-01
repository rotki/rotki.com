<script lang="ts" setup>
import type { RuiIcons } from '@rotki/ui-library';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });

const steps: { icon: RuiIcons; title: string; description: string }[] = [
  {
    icon: 'lu-user-round-plus',
    title: t('download.documentation.steps.install.title'),
    description: t('download.documentation.steps.install.description'),
  },
  {
    icon: 'lu-plug',
    title: t('download.documentation.steps.connect.title'),
    description: t('download.documentation.steps.connect.description'),
  },
  {
    icon: 'lu-file-chart-column',
    title: t('download.documentation.steps.report.title'),
    description: t('download.documentation.steps.report.description'),
  },
];
</script>

<template>
  <section class="py-14 lg:py-20 bg-rui-grey-50">
    <div class="container flex flex-col gap-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="flex flex-col gap-3 max-w-[640px]">
          <p class="text-rui-primary text-subtitle-1 font-medium">
            {{ t('download.documentation.title') }}
          </p>
          <h2 class="text-rui-text text-h4 !font-bold">
            {{ t('download.documentation.heading') }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ t('download.documentation.description') }}
          </p>
        </div>
        <ButtonLink
          color="primary"
          variant="outlined"
          size="lg"
          external
          to="https://docs.rotki.com"
          class="shrink-0"
        >
          {{ t('download.documentation.action') }}
          <template #append>
            <RuiIcon name="lu-external-link" />
          </template>
        </ButtonLink>
      </div>
      <ol class="grid md:grid-cols-3 gap-4 md:gap-6">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="flex flex-col gap-3 rounded-xl border border-rui-grey-200 bg-white p-6"
        >
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center size-10 rounded-lg bg-rui-primary/[0.08] text-rui-primary">
              <RuiIcon :name="step.icon" />
            </span>
            <span class="text-caption font-medium text-rui-text-secondary uppercase tracking-wide">
              {{ t('download.documentation.step', { number: index + 1 }) }}
            </span>
          </div>
          <h3 class="text-h6">
            {{ step.title }}
          </h3>
          <p class="text-body-2 text-rui-text-secondary">
            {{ step.description }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
