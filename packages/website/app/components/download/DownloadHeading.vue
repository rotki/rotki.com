<script lang="ts" setup>
import type { DownloadItemSingle, DownloadItem as DownloadItemType } from '~/types/download';
import { SigilEvents } from '@rotki/sigil';
import ButtonLink from '~/components/common/ButtonLink.vue';
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
      image: found.image,
      url: item.url,
      platform: item.analyticsKey,
      label: item.name,
    }));
  }

  return [found];
});

const releaseUrl = computed<string>(() => `https://github.com/rotki/rotki/releases/tag/${version}`);

function onDownloadClick(platform: string): void {
  chronicle(SigilEvents.DOWNLOAD_CLICK, {
    platform,
    version: version || undefined,
  });
}
</script>

<template>
  <div class="pt-12 pb-10 lg:pt-20 lg:pb-16">
    <div class="container flex flex-col">
      <div class="flex flex-col items-center gap-y-4 text-center mb-4">
        <!-- Reserves its height while the release loads so the heading does not jump -->
        <div class="min-h-[34px] flex items-center">
          <a
            v-if="!loading && version"
            :href="releaseUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-full border border-rui-primary/20 bg-rui-primary/[0.04] px-4 py-1.5 text-body-2 text-rui-primary hover:bg-rui-primary/[0.08] transition-colors"
          >
            <RuiIcon
              name="lu-sparkles"
              size="16"
            />
            {{ t('download.heading.whats_new', { version }) }}
            <RuiIcon
              name="lu-arrow-right"
              size="14"
            />
          </a>
        </div>
        <h1 class="text-rui-text text-h4 md:text-h3 !font-bold text-balance">
          {{ t('download.heading.description') }}
        </h1>
        <p class="text-body-1 md:text-h6 !font-normal text-rui-text-secondary max-w-[640px] text-balance">
          {{ t('download.heading.detail') }}
        </p>
        <!-- Full width, so its box does not shrink to the loading placeholder and widen once the buttons load -->
        <div class="flex flex-col items-center gap-3 pt-2 min-h-[106px] w-full">
          <!-- Linux and macOS show two buttons, which wrap onto two rows below `sm`; reserve both rows so the page does not shift once they load -->
          <div class="flex gap-2 flex-wrap justify-center min-h-[80px] sm:min-h-[42px] items-center w-full">
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
                v-for="(item, index) in highlightedDownloadItem"
                :key="item.url"
                :item="item"
                :secondary="index > 0"
                @click="onDownloadClick(item.platform)"
              />
            </template>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-1 text-body-2 text-rui-text-secondary">
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
            <span
              aria-hidden="true"
              class="hidden sm:inline"
            >
              ·
            </span>
            <p>
              {{ t('download.latest_release') }}:
              <!-- About as wide as a version such as v1.44.0, so the centred line barely moves once it loads -->
              <span
                v-if="loading"
                class="inline-block w-12 h-4 bg-rui-grey-200 rounded animate-pulse align-middle"
              />
              <template v-else>
                {{ version }}
              </template>
            </p>
            <span
              aria-hidden="true"
              class="hidden sm:inline"
            >
              ·
            </span>
            <a
              href="https://docs.rotki.com/requirement-and-installation/verify.html"
              target="_blank"
              rel="noopener"
              class="text-rui-primary underline"
            >
              {{ t('download.heading.verify') }}
            </a>
          </div>
        </div>
      </div>

      <RuiAccordions :model-value="showAll ? [0] : []">
        <RuiAccordion eager>
          <div class="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 pt-8 md:pt-12 pb-6 max-w-[960px] mx-auto">
            <DownloadItem
              v-for="(link, i) in links"
              :key="i"
              :data="link"
              class="w-full"
            />
          </div>
        </RuiAccordion>
      </RuiAccordions>

      <!-- The laurel and the sponsor read as one pair; the call to sponsor sits under both -->
      <div class="mt-10 mx-auto w-full max-w-[560px] rounded-2xl border border-rui-grey-200 px-6 pt-6 pb-3 flex flex-col items-center gap-6">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <!-- The laurel artwork is drawn to frame a short label -->
          <div class="relative w-[150px] h-[100px] flex items-center justify-center">
            <img
              src="/img/laurel.svg"
              alt=""
              width="150"
              height="100"
              loading="lazy"
              class="absolute inset-0 w-full h-full"
            />
            <p class="relative text-center text-body-2 leading-tight">
              <span class="block font-medium text-rui-text">{{ version || t('download.sponsor.this_release') }}</span>
              <span class="block text-rui-text-secondary">{{ t('download.sponsor.sponsored_by') }}</span>
            </p>
          </div>
          <div class="flex items-center justify-center gap-6">
            <DownloadSponsorItem
              v-for="(sponsor, index) in sponsors"
              :key="index"
              :sponsor="sponsor"
            />
          </div>
        </div>
        <div class="w-full border-t border-rui-grey-200 pt-2 flex justify-center">
          <ButtonLink
            to="/sponsor/mint"
            color="primary"
            size="sm"
          >
            {{ t('download.sponsor.become_sponsor') }}
            <template #append>
              <RuiIcon
                name="lu-arrow-right"
                size="16"
              />
            </template>
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
