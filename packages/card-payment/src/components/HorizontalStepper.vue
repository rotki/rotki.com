<script setup lang="ts">
interface Step {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface Props {
  steps: Step[];
}

defineProps<Props>();
</script>

<template>
  <div class="py-10 lg:px-4 w-full max-w-[29rem] mx-auto">
    <div class="flex justify-center">
      <div class="flex items-center space-x-3">
        <template
          v-for="(step, index) in steps"
          :key="index"
        >
          <!-- Step pill -->
          <div
            class="h-2 w-20 md:w-[8.5rem] rounded-full transition-colors duration-200"
            :class="{
              'bg-rui-primary': step.current,
              'bg-rui-grey-300': !step.current,
            }"
          />
        </template>
      </div>
    </div>
  </div>
</template>
