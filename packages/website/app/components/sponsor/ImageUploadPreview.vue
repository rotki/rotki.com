<script setup lang="ts">
interface Props {
  disabled?: boolean;
  imagePreview?: string;
  errorMessages?: string[];
  hint?: string;
}

const { disabled = false, imagePreview = '', errorMessages = [], hint = '' } = defineProps<Props>();

const emit = defineEmits<{
  'file-selected': [file: File];
  'remove': [];
}>();

const { t } = useI18n({ useScope: 'global' });

function handleImageChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
}
</script>

<template>
  <div>
    <div
      v-if="!imagePreview"
      class="relative mt-3"
    >
      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        class="hidden"
        :disabled="disabled"
        @change="handleImageChange($event)"
      />
      <label
        for="image-upload"
        class="flex flex-col items-center justify-center w-full h-32 border border-dashed border-rui-grey-300 dark:border-rui-grey-600 rounded-lg cursor-pointer hover:border-rui-primary transition-colors"
      >
        <RuiIcon
          name="lu-upload"
          size="24"
          class="mb-2 text-rui-text-secondary"
        />
        <span class="text-sm text-rui-text-secondary">{{ t('sponsor.submit_name.upload_image') }}</span>
        <span class="text-xs text-rui-text-disabled mt-1">{{ t('sponsor.submit_name.image_requirements') }}</span>
      </label>
    </div>
    <div
      v-else
      class="relative flex items-start"
    >
      <!-- Plain <img> instead of <NuxtImg> because the src can be a data URL from FileReader, which NuxtImg's image provider cannot process -->
      <img
        :src="imagePreview"
        alt="Profile preview"
        class="w-32 h-32 object-cover rounded-lg mt-3"
        width="128"
        height="128"
      />
      <RuiButton
        icon
        size="sm"
        color="error"
        class="-ml-3"
        :disabled="disabled"
        @click="emit('remove')"
      >
        <RuiIcon
          name="lu-x"
          size="16"
        />
      </RuiButton>
    </div>

    <div
      v-if="errorMessages.length > 0"
      class="pt-1 px-3 text-rui-error text-sm text-caption"
    >
      <p
        v-for="errorMsg in errorMessages"
        :key="errorMsg"
      >
        {{ errorMsg }}
      </p>
    </div>
    <div
      v-else-if="hint"
      class="pt-1 px-3 text-rui-text-secondary text-sm text-caption"
    >
      {{ hint }}
    </div>
  </div>
</template>
