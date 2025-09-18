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
  <aside class="max-lg:hidden lg:block max-w-[20.8rem] sticky top-0 self-start">
    <div class="flex flex-col">
      <template
        v-for="(step, index) in steps"
        :key="index"
      >
        <div
          class="relative flex items-center px-0 py-6"
          :class="{
            'text-rui-primary': step.completed || step.current,
          }"
        >
          <div class="relative flex py-2">
            <span
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-rui-primary text-white': step.completed || step.current,
                'bg-white border border-rui-primary text-rui-primary': !step.completed && !step.current,
              }"
            >
              <!-- Checkmark for completed steps -->
              <svg
                v-if="step.completed"
                class="w-5 h-5"
                height="20"
                width="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                />
              </svg>
              <!-- Circle for current step -->
              <svg
                v-else-if="step.current"
                class="w-5 h-5"
                height="20"
                width="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21C16.9705 21 21 16.9705 21 12C21 7.02943 16.9705 3 12 3C7.02943 3 3 7.02943 3 12C3 16.9705 7.02943 21 12 21Z"
                  fill="currentColor"
                  stroke="none"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                />
              </svg>
              <!-- Step number for inactive steps -->
              <span
                v-else
                class="text-xs font-medium"
              >
                {{ index + 1 }}
              </span>
            </span>
          </div>
          <div class="ml-2 flex flex-col items-start text-left">
            <span class="text-rui-primary text-subtitle-2 font-medium">{{ step.title }}</span>
            <span class="text-caption text-rui-text-secondary">
              {{ step.description }}
            </span>
          </div>
        </div>

        <!-- Divider (except for last step) -->
        <hr
          v-if="index < steps.length - 1"
          class="block h-full max-h-full min-h-12 min-w-0 self-start border-l border-rui-grey-400 mx-5 my-[-1rem]"
        />
      </template>
    </div>
  </aside>
</template>
