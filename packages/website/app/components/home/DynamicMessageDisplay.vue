<script setup lang="ts">
import type { DashboardMessage } from '@/types/dynamic-messages';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useRandomStepper } from '~/composables/use-random-stepper';

const { messages } = defineProps<{
  messages: DashboardMessage[];
}>();

const { step, steps, onNavigate, onPause, onResume } = useRandomStepper(messages.length);

const activeItem = computed<DashboardMessage | undefined>(() => messages[get(step) - 1]);
</script>

<template>
  <!-- One line at every width: the homepage lays it over the hero's top padding, so it must never grow taller -->
  <div
    class="px-4 py-2 text-body-2 md:text-body-1 text-rui-primary flex items-center justify-between border-b border-default w-full bg-white dark:bg-[#1E1E1E] gap-4"
  >
    <div
      class="flex-1 min-w-0"
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
          class="flex items-center md:justify-center gap-1 min-w-0 whitespace-nowrap"
        >
          <!-- Phones show only the highlight and the link; the text before them is cut first -->
          <span class="hidden md:inline truncate min-w-0">
            {{ activeItem.message }}
          </span>
          <span
            v-if="activeItem.messageHighlight"
            class="font-semibold truncate min-w-0"
          >
            {{ activeItem.messageHighlight }}
          </span>

          <ButtonLink
            v-if="activeItem.action"
            color="primary"
            inline
            class="shrink-0 font-semibold underline"
            external
            :to="activeItem.action?.url"
          >
            {{ activeItem.action.text }}
          </ButtonLink>
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
