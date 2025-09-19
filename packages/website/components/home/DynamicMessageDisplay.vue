<script setup lang="ts">
import type { DashboardMessage } from '@/types/dynamic-messages';
import { get } from '@vueuse/core';
import { useRandomStepper } from '~/composables/random-stepper';

const props = defineProps<{
  messages: DashboardMessage[];
}>();

const { step, steps, onNavigate, onPause, onResume } = useRandomStepper(props.messages.length);

const activeItem = computed(() => props.messages[get(step) - 1]);
</script>

<template>
  <div
    class="px-4 py-2 text-body-1 text-rui-primary flex items-center justify-between border-b border-default w-full bg-white dark:bg-[#1E1E1E] gap-4"
  >
    <div
      class="flex-1 md:text-center"
      @mouseover="onPause()"
      @mouseleave="onResume()"
    >
      <TransitionGroup
        enter-from-class="h-0 opacity-0"
        enter-to-class="h-full opacity-1"
        enter-active-class="transition duration-300"
        leave-from-class="h-full opacity-1"
        leave-to-class="h-0 opacity-0"
        leave-active-class="transition duration-100"
      >
        <div
          v-if="activeItem"
          :key="step"
        >
          {{ activeItem.message }}
          <div class="font-semibold inline">
            <span
              v-if="activeItem.messageHighlight"
              class="mr-1"
            >
              {{ activeItem.messageHighlight }}
            </span>

            <ButtonLink
              v-if="activeItem.action"
              color="primary"
              inline
              class="text-left -mx-1 md:text-center underline"
              external
              :to="activeItem.action?.url"
            >
              {{ activeItem.action.text }}
            </ButtonLink>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <RuiFooterStepper
      v-if="steps > 1"
      class="ml-auto"
      :model-value="step"
      :pages="steps"
      variant="bullet"
      hide-buttons
      @update:model-value="onNavigate($event)"
    />
  </div>
</template>
