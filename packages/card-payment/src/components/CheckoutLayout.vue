<script setup lang="ts">
import HorizontalStepper from './HorizontalStepper.vue';
import VerticalStepper from './VerticalStepper.vue';

interface Step {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface Props {
  steps: Step[];
  currentStep?: number;
}

withDefaults(defineProps<Props>(), {
  currentStep: 3,
});
</script>

<template>
  <div class="container flex flex-col lg:flex-row py-8 h-full grow mx-auto px-4">
    <div class="flex justify-center grow order-1 lg:order-1 gap-20">
      <div class="flex justify-center grow">
        <!-- Main content slot -->
        <div class="grow">
          <slot />
          <!-- Footer Stepper (horizontal) - Pill variant for mobile/tablet only -->
          <HorizontalStepper
            :steps="steps"
            class="lg:hidden"
          />
        </div>
      </div>
      <!-- Vertical Stepper (desktop only) -->
      <VerticalStepper :steps="steps" />
    </div>
  </div>
</template>
