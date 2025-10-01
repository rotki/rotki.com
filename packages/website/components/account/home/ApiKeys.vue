<script setup lang="ts">
import { useApiKeys } from '~/composables/use-api-keys';

const { apiKey, apiSecret, hasApiKeys, loading, updateKeys } = useApiKeys();

async function regenerateKeys() {
  await updateKeys();
}

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div class="text-h6">
        {{ t('account.api_keys.title') }}
      </div>
      <div>
        <RuiButton
          color="primary"
          :loading="loading"
          @click="regenerateKeys()"
        >
          <template #prepend>
            <RuiIcon
              name="lu-refresh-cw"
              size="18"
            />
          </template>
          {{ hasApiKeys ? t('actions.regenerate') : t('actions.generate') }}
        </RuiButton>
      </div>
    </div>
    <div
      v-if="hasApiKeys"
      class="grid md:grid-cols-2 gap-4"
    >
      <RuiRevealableTextField
        id="api-key"
        :model-value="apiKey"
        :disabled="loading"
        variant="outlined"
        :label="t('account.api_keys.api_key')"
        readonly
        dense
        hide-details
        color="primary"
      >
        <template #append>
          <div class="h-6 border-r border-rui-grey-400 ml-2 mr-1" />
          <CopyButton :model-value="apiKey" />
        </template>
      </RuiRevealableTextField>

      <RuiRevealableTextField
        id="api-secret"
        :model-value="apiSecret"
        :disabled="loading"
        variant="outlined"
        :label="t('account.api_keys.api_secret')"
        readonly
        dense
        hide-details
        color="primary"
      >
        <template #append>
          <div class="h-6 border-r border-rui-grey-400 ml-2 mr-1" />
          <CopyButton :model-value="apiSecret" />
        </template>
      </RuiRevealableTextField>
    </div>
    <div
      v-else
      class="text-rui-text-secondary"
    >
      {{ t('account.api_keys.not_generated') }}
    </div>
  </div>
</template>
