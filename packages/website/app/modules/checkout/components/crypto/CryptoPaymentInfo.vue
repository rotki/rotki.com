<script setup lang="ts">
import { get, set } from '@vueuse/core';

const { t } = useI18n({ useScope: 'global' });

const expanded = ref<boolean>(true);

const notes = computed<string[]>(() => [
  t('home.plans.tiers.step_3.notes.line_1'),
  t('home.plans.tiers.step_3.notes.line_2'),
  t('home.plans.tiers.step_3.notes.line_3'),
]);

function toggle(): void {
  set(expanded, !get(expanded));
}
</script>

<template>
  <div class="text-body-2">
    <button
      type="button"
      class="flex items-center gap-2 text-rui-primary hover:text-rui-primary-darker transition-colors w-full"
      @click="toggle()"
    >
      <RuiIcon
        :name="expanded ? 'lu-chevron-down' : 'lu-chevron-right'"
        size="20"
      />
      <span class="font-medium">{{ t('home.plans.tiers.step_3.how_crypto_works') }}</span>
    </button>

    <div
      v-if="expanded"
      class="mt-4"
    >
      <div
        v-for="(note, i) in notes"
        :key="i"
        class="flex flex-row mt-4 gap-2"
      >
        <div>
          <RuiChip
            color="primary"
            size="sm"
          >
            <span class="h-6 flex items-center justify-center">{{ i + 1 }}</span>
          </RuiChip>
        </div>
        <div>
          {{ note }}
        </div>
      </div>
    </div>
  </div>
</template>
