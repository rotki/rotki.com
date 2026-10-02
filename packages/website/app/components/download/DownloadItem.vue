<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';
import ButtonLink from '~/components/common/ButtonLink.vue';
import InputWithCopyButton from '~/components/common/InputWithCopyButton.vue';

defineProps<{
  data: DownloadItem;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    data-cy="download-item"
    class="p-6 rounded-xl border border-rui-grey-200 bg-white flex flex-col gap-4"
  >
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center size-12 shrink-0 bg-rui-primary/[0.06] rounded-[0.625rem] text-rui-primary">
        <RuiIcon
          v-if="data.icon"
          :name="data.icon"
          color="primary"
        />
        <img
          v-else-if="data.image"
          :src="data.image"
          :alt="data.label"
          width="24"
          height="24"
          loading="lazy"
        />
      </div>
      <div>
        <!-- An h2: the page title is the h1, and nothing sits between them -->
        <h2 class="text-h6 font-medium">
          {{ data.label }}
        </h2>
        <p
          v-if="data.caption"
          class="text-body-2 text-rui-text-secondary"
        >
          {{ data.caption }}
        </p>
      </div>
    </div>

    <div
      v-if="!('group' in data) && data.command"
      class="flex flex-col gap-2"
    >
      <InputWithCopyButton
        :model-value="data.command"
        :copy-value="data.command"
        :aria-label="t('download.install_command', { platform: data.label })"
        hide-details
        dense
        readonly
      />
      <ButtonLink
        :to="data.url"
        external
        size="sm"
        color="primary"
        class="self-start -ml-2"
      >
        {{ t('download.read_the_doc') }}
        <template #append>
          <RuiIcon
            name="lu-external-link"
            size="16"
          />
        </template>
      </ButtonLink>
    </div>

    <!-- Every variant is a direct link, so nobody has to open a menu to find their build -->
    <div
      v-else-if="'group' in data"
      class="flex flex-wrap gap-2"
    >
      <a
        v-for="(item, index) in data.items"
        :key="item.url"
        :href="item.url"
        :aria-label="item.name"
        download
      >
        <RuiButton
          color="primary"
          :variant="index === 0 ? 'default' : 'outlined'"
          tabindex="-1"
        >
          <template #prepend>
            <RuiIcon
              name="lu-download"
              size="16"
            />
          </template>
          {{ item.variant }}
        </RuiButton>
      </a>
    </div>

    <a
      v-else
      :href="data.url"
      :aria-label="t('download.download_for', { platform: data.label })"
      download
      class="self-start"
    >
      <RuiButton
        color="primary"
        tabindex="-1"
      >
        <template #prepend>
          <RuiIcon
            name="lu-download"
            size="16"
          />
        </template>
        {{ t('download.action') }}
      </RuiButton>
    </a>
  </div>
</template>
