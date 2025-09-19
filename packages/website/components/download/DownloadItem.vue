<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';

defineProps<{
  data: DownloadItem;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div :class="$style.wrapper">
    <div :class="$style.icon">
      <RuiIcon
        v-if="data.icon"
        :name="data.icon"
        color="primary"
      />
      <img
        v-else-if="data.image"
        :src="data.image"
        :alt="data.platform"
      />
    </div>
    <div :class="$style.body">
      <div>
        <p :class="$style.for">
          {{ t('download.download_for') }}
        </p>
        <h6 :class="$style.platform">
          {{ data.platform }}
        </h6>

        <div
          v-if="data.command"
          class="pt-4"
        >
          <InputWithCopyButton
            v-if="data.command"
            :model-value="data.command"
            :copy-value="data.command"
            hide-details
            dense
            readonly
          />
        </div>
      </div>
      <div>
        <RuiMenu v-if="'group' in data">
          <template #activator="{ attrs }">
            <RuiButton
              v-bind="attrs"
              color="primary"
            >
              {{ t('download.action') }}
              <template #append>
                <RuiIcon
                  name="lu-chevron-down"
                  size="18"
                />
              </template>
            </RuiButton>
          </template>
          <div class="py-2">
            <a
              v-for="item in data.items"
              :key="item.url"
              :href="item.url"
            >
              <RuiButton variant="list">
                {{ item.name }}
              </RuiButton>
            </a>
          </div>
        </RuiMenu>
        <template v-else>
          <ButtonLink
            v-if="data.command"
            :to="data.url"
            external
            size="sm"
            color="primary"
          >
            {{ t('download.read_the_doc') }}
            <template #append>
              <RuiIcon
                name="lu-external-link"
                size="16"
              />
            </template>
          </ButtonLink>
          <a
            v-else
            :href="data.url"
            download
          >
            <RuiButton
              color="primary"
            >
              {{ t('download.action') }}
            </RuiButton>
          </a>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply p-4 lg:p-6 bg-rui-primary/[0.04];
  @apply flex flex-col gap-y-4;

  .icon {
    @apply flex items-center justify-center p-3 w-12 h-12 bg-white rounded-[0.625rem] text-rui-primary;
  }

  .body {
    @apply flex items-end md:items-start justify-between md:flex-col gap-x-4 gap-y-4 flex-wrap;
  }

  .for {
    @apply text-body-1 text-rui-text-secondary;
  }

  .platform {
    @apply text-h6 font-medium;
  }
}
</style>
