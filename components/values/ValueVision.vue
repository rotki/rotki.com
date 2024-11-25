<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { t } = useI18n();

const values: { icon: RuiIcons; label: string }[] = [
  { icon: 'bank-line', label: t('values.vision_section.list.line_1') },
  { icon: 'money-dollar-circle-line', label: t('values.vision_section.list.line_2') },
  { icon: 'calendar-todo-line', label: t('values.vision_section.list.line_3') },
  { icon: 'hand-coin-line', label: t('values.vision_section.list.line_4') },
];
</script>

<template>
  <div class="py-10 md:py-20">
    <div class="container space-y-10 md:space-y-16">
      <div class="space-y-5">
        <div class="text-h4">
          {{ t('values.vision_section.title') }}
        </div>
        <div class="text-body-1">
          {{ t('values.vision_section.description') }}
        </div>
      </div>
      <div
        class="flex flex-col lg:flex-row gap-12 items-center justify-between"
      >
        <div class="w-full lg:w-[560px] space-y-12">
          <div
            v-for="(value, index) in values"
            :key="index"
            class="flex space-x-4"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-[10px] bg-rui-primary text-white flex items-center justify-center"
            >
              <RuiIcon :name="value.icon" />
            </div>
            <div class="text-body-1 text-rui-text-secondary">
              {{ value.label }}
            </div>
          </div>
        </div>
        <div
          class="shrink-0 w-[240px] h-[240px] md:w-[360px] md:h-[360px] lg:w-[400px] lg:h-[400px]"
        >
          <img
            src="/img/rotki-values.webp"
            alt="Rotki values"
            class="rounded-full w-full h-full border-[12px] border-rui-grey-200"
          />
        </div>
      </div>
    </div>
  </div>
</template>
