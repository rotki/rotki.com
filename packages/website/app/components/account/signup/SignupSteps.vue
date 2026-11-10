<script setup lang="ts">
import { get } from '@vueuse/shared';

const { step } = defineProps<{
  step: number;
}>();

const { t } = useI18n({ useScope: 'global' });

const steps = computed<string[]>(() => [
  t('auth.signup.steps.step_1.title'),
  t('auth.signup.steps.step_2.title'),
]);

const label = computed<string>(() => t('auth.signup.step_label', {
  current: step,
  total: get(steps).length,
  title: get(steps)[step - 1] ?? '',
}));
</script>

<template>
  <div>
    <p
      class="sr-only"
      data-cy="step-label"
      aria-live="polite"
    >
      {{ label }}
    </p>
    <ol
      class="flex items-center gap-2.5 md:gap-3 text-body-2"
      aria-hidden="true"
    >
      <template
        v-for="(title, index) in steps"
        :key="title"
      >
        <li
          v-if="index > 0"
          class="flex-1 h-0.5 rounded-full"
          :class="index < step ? 'bg-rui-primary' : 'bg-rui-grey-200'"
        />
        <li
          class="flex items-center gap-2 whitespace-nowrap font-medium"
          :class="index + 1 === step ? 'text-rui-text' : 'text-rui-text-secondary'"
        >
          <span
            class="size-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
            :class="{
              'bg-rui-primary text-white': index + 1 === step,
              'bg-rui-primary/10 text-rui-primary': index + 1 < step,
              'border border-rui-grey-300': index + 1 > step,
            }"
          >
            <RuiIcon
              v-if="index + 1 < step"
              name="lu-check"
              size="14"
            />
            <template v-else>{{ index + 1 }}</template>
          </span>
          {{ title }}
        </li>
      </template>
    </ol>
  </div>
</template>
