<script lang="ts" setup>
import type { DownloadItem, DownloadItemSingle } from '~/types/download';

const props = defineProps<{ version: string; links: DownloadItem[] }>();
const { t } = useI18n({ useScope: 'global' });

const showAll = ref(false);

function getOS() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('win'))
    return 'WINDOWS';
  if (userAgent.includes('mac'))
    return 'MAC';
  if (userAgent.includes('linux'))
    return 'LINUX';

  return 'WINDOWS';
}

const highlightedDownloadItem = computed<DownloadItemSingle[]>(() => {
  const found = props.links.find(item => item.platform === getOS());
  if (!found)
    return [];

  if ('group' in found) {
    return found.items.map(item => ({
      icon: found.icon,
      url: item.url,
      platform: item.name,
    }));
  }

  return [found];
});
</script>

<template>
  <div class="py-10 lg:py-20">
    <div class="container flex flex-col">
      <div class="flex flex-col items-start gap-y-4">
        <h6 class="text-rui-light-primary text-h6 font-medium">
          {{ t('download.heading.download_rotki') }}
        </h6>
        <h3 class="text-rui-text text-h4">
          {{ t('download.heading.description') }}
        </h3>
        <div class="flex flex-col items-start gap-3 pt-2">
          <ClientOnly>
            <div class="flex gap-2 flex-wrap">
              <ButtonLink
                v-for="item in highlightedDownloadItem"
                :key="item.url"
                :to="item.url"
                rounded
                color="primary"
                variant="default"
                size="lg"
                data-cy="main-download-button"
              >
                <template #prepend>
                  <RuiIcon
                    v-if="item.icon"
                    :name="item.icon"
                    size="20"
                  />
                  <img
                    v-else-if="item.image"
                    :src="item.image"
                    :alt="item.platform"
                    class="brightness-0 invert"
                    size="20px"
                  />
                </template>
                {{ t('download.download_for', { platform: item.platform }) }}
              </ButtonLink>
            </div>
            <template #fallback>
              <div class="h-[42px]" />
            </template>
          </ClientOnly>

          <div class="pl-1">
            <RuiButton
              size="sm"
              variant="text"
              color="primary"
              class="!p-0 !text-sm underline"
              data-cy="show-all-download"
              @click="showAll = true"
            >
              {{ t('download.download_for_other_os') }}
            </RuiButton>

            <p class="text-sm text-rui-text-secondary">
              {{ t('download.latest_release') }}: {{ version }}
            </p>
          </div>
        </div>
      </div>

      <RuiAccordions :model-value="showAll ? [0] : []">
        <RuiAccordion eager>
          <div class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-8 md:pt-16 pb-6">
            <DownloadItem
              v-for="(link, i) in links"
              :key="i"
              :data="link"
              class="w-full"
            />
          </div>
        </RuiAccordion>
      </RuiAccordions>
    </div>
  </div>
</template>
