<script setup lang="ts">
import AccountSection from '~/components/account/home/AccountSection.vue';
import CopyButton from '~/components/common/CopyButton.vue';
import { useApiKeys } from '~/composables/account/use-api-keys';

const { apiKey, apiSecret, hasApiKeys, loading, updateKeys } = useApiKeys();

async function regenerateKeys() {
  await updateKeys();
}

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <AccountSection
    :title="t('account.api_keys.connect.title')"
    :description="t('account.api_keys.connect.description')"
  >
    <ol class="rounded-lg border border-default divide-y divide-rui-grey-200 dark:divide-rui-grey-800">
      <li class="p-5 md:p-6 flex gap-4">
        <span
          aria-hidden="true"
          class="size-7 shrink-0 rounded-full bg-rui-primary/10 text-rui-primary grid place-items-center text-body-2 font-bold"
        >
          1
        </span>
        <div class="flex-1 min-w-0 space-y-4">
          <p class="pt-0.5 text-body-1 font-medium text-rui-text">
            {{ t('account.api_keys.connect.copy') }}
          </p>
          <div
            v-if="hasApiKeys"
            class="grid md:grid-cols-2 gap-4"
          >
            <RuiRevealableTextField
              id="api-key"
              :model-value="apiKey"
              :disabled="loading"
              :label="t('account.api_keys.api_key')"
              readonly
              dense
              details="hidden"
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
              :label="t('account.api_keys.api_secret')"
              readonly
              dense
              details="hidden"
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
            class="flex flex-col items-start gap-3"
          >
            <p class="text-body-2 text-rui-text-secondary">
              {{ t('account.api_keys.not_generated') }}
            </p>
            <RuiButton
              color="primary"
              :loading="loading"
              @click="regenerateKeys()"
            >
              {{ t('actions.generate') }}
            </RuiButton>
          </div>
        </div>
      </li>
      <li class="p-5 md:p-6 flex gap-4">
        <span
          aria-hidden="true"
          class="size-7 shrink-0 rounded-full bg-rui-primary/10 text-rui-primary grid place-items-center text-body-2 font-bold"
        >
          2
        </span>
        <div class="pt-0.5">
          <p class="text-body-1 font-medium text-rui-text">
            {{ t('account.api_keys.connect.open_app') }}
          </p>
          <p class="mt-1 text-body-2 text-rui-text-secondary">
            <a
              href="https://docs.rotki.com/premium/api-keys.html#using-api-credentials-in-the-app"
              target="_blank"
              rel="noopener noreferrer"
              class="text-rui-primary underline underline-offset-2 hover:no-underline"
            >
              {{ t('account.api_keys.docs_hint') }}
            </a>
          </p>
        </div>
      </li>
      <li class="p-5 md:p-6 flex gap-4">
        <span
          aria-hidden="true"
          class="size-7 shrink-0 rounded-full bg-rui-primary/10 text-rui-primary grid place-items-center text-body-2 font-bold"
        >
          3
        </span>
        <div class="pt-0.5">
          <p class="text-body-1 font-medium text-rui-text">
            {{ t('account.api_keys.connect.paste') }}
          </p>
          <p class="mt-1 text-body-2 text-rui-text-secondary">
            {{ t('account.api_keys.connect.paste_hint') }}
          </p>
        </div>
      </li>
    </ol>

    <div
      v-if="hasApiKeys"
      class="mt-5 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <RuiButton
        color="primary"
        variant="outlined"
        :loading="loading"
        class="self-start shrink-0"
        @click="regenerateKeys()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-refresh-cw"
            size="16"
          />
        </template>
        {{ t('account.api_keys.regenerate') }}
      </RuiButton>
      <p class="text-body-2 text-rui-text-secondary">
        {{ t('account.api_keys.regenerate_hint') }}
      </p>
    </div>
  </AccountSection>
</template>
