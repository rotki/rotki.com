<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import AuthHeading from '~/components/account/AuthHeading.vue';

type AuthShellTone = 'primary' | 'success' | 'error';

const {
  title,
  description,
  icon,
  tone = 'primary',
  loading = false,
} = defineProps<{
  title?: string;
  description?: string;
  icon?: RuiIcons;
  tone?: AuthShellTone;
  loading?: boolean;
}>();

defineSlots<{
  default?: () => void;
  footer?: () => void;
}>();

const TONE_CLASSES: Record<AuthShellTone, string> = {
  error: 'bg-rui-error/10 text-rui-error',
  primary: 'bg-rui-primary/10 text-rui-primary',
  success: 'bg-rui-success/10 text-rui-success',
};
</script>

<template>
  <div class="container flex justify-center py-12 md:py-20 lg:py-24">
    <div class="w-full max-w-[400px]">
      <div
        v-if="loading"
        class="flex justify-center py-12"
      >
        <RuiProgress
          variant="indeterminate"
          circular
          color="primary"
        />
      </div>
      <template v-else>
        <div
          v-if="icon"
          class="mb-6 size-12 rounded-full flex items-center justify-center"
          :class="TONE_CLASSES[tone]"
        >
          <RuiIcon
            :name="icon"
            size="24"
          />
        </div>
        <AuthHeading
          :title="title"
          :description="description"
        />
        <div
          v-if="$slots.default"
          class="mt-8"
        >
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="mt-8 pt-6 border-t border-default text-body-2 text-rui-text-secondary text-center"
        >
          <slot name="footer" />
        </div>
      </template>
    </div>
  </div>
</template>
