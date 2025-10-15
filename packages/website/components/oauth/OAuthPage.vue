<script setup lang="ts">
import type { OAuthMode } from '~/types/oauth';

interface Props {
  title: string;
  description: string;
  buttonText: string;
  loading: boolean;
  error?: string;
  completed: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  mode?: OAuthMode;
  currentMode?: OAuthMode;
  showExpiresIn?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'auth-click': [];
}>();

const { t } = useI18n({ useScope: 'global' });
const otherHeight = inject('otherHeight', 0);
</script>

<template>
  <div
    class="container"
    :class="[$style.wrapper]"
  >
    <div class="max-w-md w-full">
      <div class="text-center">
        <h4 class="text-h4 mt-6">
          {{ completed ? t('oauth.completion.title') : title }}
        </h4>
        <p class="mt-2 text-sm text-rui-text-secondary">
          {{ completed ? t('oauth.completion.description') : description }}
        </p>
      </div>

      <div class="mt-6 space-y-6">
        <RuiAlert
          v-if="error"
          type="error"
        >
          {{ error }}
        </RuiAlert>

        <RuiAlert
          v-if="completed && (mode === 'app' || currentMode === 'app')"
          type="success"
        >
          {{ t('oauth.completion.description') }}
        </RuiAlert>

        <div
          v-if="completed && (mode === 'docker' || currentMode === 'docker')"
          class="space-y-4"
        >
          <RuiAlert type="success">
            {{ t('oauth.completion.docker_description') }}
          </RuiAlert>

          <RuiTextArea
            :model-value="accessToken"
            :label="t('oauth.access_token_label')"
            readonly
            variant="outlined"
            color="primary"
            rows="4"
            @click="($event.target as HTMLTextAreaElement).select()"
          >
            <template #append>
              <CopyButton :model-value="accessToken" />
            </template>
          </RuiTextArea>

          <RuiTextArea
            :model-value="refreshToken"
            :label="t('oauth.refresh_token_label')"
            readonly
            variant="outlined"
            color="primary"
            rows="4"
            @click="($event.target as HTMLTextAreaElement).select()"
          >
            <template #append>
              <CopyButton :model-value="refreshToken" />
            </template>
          </RuiTextArea>

          <div
            v-if="showExpiresIn && expiresIn"
            class="text-sm text-rui-text-secondary"
          >
            <slot
              name="expires-in"
              :expires-in="expiresIn"
            />
          </div>
        </div>

        <RuiButton
          v-if="!completed"
          color="primary"
          class="w-full"
          size="lg"
          :loading="loading"
          :disabled="!mode || !['app', 'docker'].includes(mode)"
          @click="emit('auth-click')"
        >
          <template
            v-if="$slots['button-prepend']"
            #prepend
          >
            <slot name="button-prepend" />
          </template>
          {{ buttonText }}
        </RuiButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply w-full flex flex-col lg:flex-row gap-10 lg:gap-20 items-center justify-center;
  @apply text-center lg:text-left py-4;
  min-height: calc(100vh - v-bind(otherHeight) * 1px);
}
</style>
