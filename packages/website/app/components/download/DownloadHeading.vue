<script lang="ts" setup>
import type { DownloadItemSingle, DownloadItem as DownloadItemType } from '~/types/download';
import { SigilEvents } from '@rotki/sigil';
import DownloadItem from '~/components/download/DownloadItem.vue';
import DownloadPlatformButton from '~/components/download/DownloadPlatformButton.vue';
import DownloadSponsorItem, { type DownloadSponsor } from '~/components/download/DownloadSponsorItem.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';

const { version, links, loading } = defineProps<{ version: string; links: DownloadItemType[]; loading?: boolean }>();
const { t } = useI18n({ useScope: 'global' });
const { chronicle } = useSigilEvents();

const showAll = ref<boolean>(false);

const sponsors: DownloadSponsor[] = [
  {
    name: 'Ambire Wallet',
    image: '/img/sponsorship-profiles/1.44.0_ambire.png',
    gold: true,
  },
];

function getOS(): string {
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
  const found = links.find(item => item.platform === getOS());
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

function onDownloadClick(platform: string): void {
  chronicle(SigilEvents.DOWNLOAD_CLICK, {
    platform,
    version: version || undefined,
  });
}
</script>

<template>
  <div class="pt-6 pb-10 lg:pt-10 lg:pb-20">
    <div class="container flex flex-col">
      <div class="flex flex-col items-center gap-y-4 text-center mb-4">
        <h6 class="text-rui-light-primary text-h6 font-medium">
          {{ t('download.heading.download_rotki') }}
        </h6>
        <h1 class="text-rui-text text-h4">
          {{ t('download.heading.description') }}
        </h1>
        <div class="flex flex-col items-center gap-3 pt-2 min-h-[106px]">
          <div class="flex gap-2 flex-wrap justify-center min-h-[42px] items-center">
            <RuiButton
              v-if="loading"
              rounded
              color="primary"
              variant="default"
              size="lg"
              disabled
              loading
            >
              {{ t('download.download_for', { platform: '...' }) }}
            </RuiButton>
            <template v-else>
              <DownloadPlatformButton
                v-for="item in highlightedDownloadItem"
                :key="item.url"
                :item="item"
                @click="onDownloadClick(item.platform)"
              />
            </template>
          </div>

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
              {{ t('download.latest_release') }}:
              <span
                v-if="loading"
                class="inline-block w-16 h-4 bg-rui-grey-200 rounded animate-pulse align-middle"
              />
              <template v-else>
                {{ version }}
              </template>
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

      <div class="flex items-center justify-center mt-6 gap-12">
        <div class="flex flex-col mb-4 w-[150px]">
          <img
            src="/img/laurel.svg"
            alt="Sponsor laurel"
            width="150"
            height="100"
            loading="lazy"
            class="w-full"
          />
          <div class="text-center -mt-11 text-sm">
            <div>This release is</div>
            <div class="text-rui-text-secondary">
              Sponsored by:
            </div>
          </div>
        </div>
        <div class="flex-1 flex items-center justify-start">
          <DownloadSponsorItem
            v-for="(sponsor, index) in sponsors"
            :key="index"
            :sponsor="sponsor"
          />
        </div>
      </div>
    </div>
  </div>
</template>
