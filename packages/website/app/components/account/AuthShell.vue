<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

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
  /** Replaces the plain `description` when it needs markup. */
  description?: () => void;
  footer?: () => void;
}>();

const TONE_CLASSES: Record<AuthShellTone, string> = {
  error: 'bg-rui-error/10 text-rui-error',
  primary: 'bg-rui-primary/10 text-rui-primary',
  success: 'bg-rui-success/10 text-rui-success',
};
</script>

<template>
  <div class="container flex justify-center py-10 md:py-16 lg:py-20">
    <!-- A card on the focused layout's tinted background; on phones it drops the frame and fills the screen. -->
    <div class="w-full max-w-[480px] md:rounded-2xl md:border md:border-default md:bg-white md:px-10 md:py-12 md:shadow-sm">
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
        <div class="text-center">
          <div
            v-if="icon"
            class="mx-auto mb-6 size-16 rounded-full flex items-center justify-center"
            :class="TONE_CLASSES[tone]"
          >
            <RuiIcon
              :name="icon"
              size="28"
            />
          </div>
          <h1 class="text-h5 md:text-h4 text-rui-text text-pretty">
            {{ title }}
          </h1>
          <div
            v-if="$slots.description || description"
            class="mt-3 text-body-1 text-rui-text-secondary text-pretty"
          >
            <slot name="description">
              {{ description }}
            </slot>
          </div>
        </div>
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
